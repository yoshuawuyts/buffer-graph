var Emitter = require('events').EventEmitter
var blake2b = require('blake2b')
var assert = require('assert')

module.exports = BufferGraph

function BufferGraph (key) {
  if (!(this instanceof BufferGraph)) return new BufferGraph(key)
  Emitter.call(this)

  assert.ok(key, Buffer.isBuffer(key), 'buffer-graph: key should be a buffer')

  this.key = key
  this.roots = []  // nodes that should be resolved when .start() is called
  this.nodes = {}  // references to all nodes, keeps state except "data"
  this.state = {}  // data that is passed into each node

  this.state.metadata = {}  // non-buffer metadata, does not cause triggers
}
BufferGraph.prototype = Object.create(Emitter.prototype)

BufferGraph.prototype.node = function (nodeName, dependencies, handler) {
  if (!handler) {
    handler = dependencies
    dependencies = []
  }

  assert.equal(typeof nodeName, 'string', 'buffer-graph.node: nodeName should be type string')
  assert.equal(Array.isArray(dependencies), true, 'buffer-graph.node: dependencies should be an array')
  assert.equal(typeof handler, 'function', 'buffer-graph.node: handler should be type function')

  var self = this

  var node = this.nodes[nodeName]
  if (!node) node = this.nodes[nodeName] = createNode()
  node.dependencies = dependencies
  node.handler = handler.bind(this)

  this.state[nodeName] = {}

  if (dependencies.length === 0) {
    this.roots.push(nodeName)
  } else {
    dependencies.forEach(function (dependency) {
      var arr = dependency.split(':')
      var a = arr[0]
      var b = arr[1]
      var node = self.nodes[a]
      if (!node) {
        node = createNode()
        self.nodes[a] = node
      }
      if (!node.edges[b]) self.nodes[a].edges[b] = []
      node.edges[b].push(nodeName)
    })
  }

  return this
}

BufferGraph.prototype.start = function (metadata) {
  assert.ok(this.roots.length, 'buffer-graph.start: no roots detected, cannot start the graph')

  var self = this
  this.state.metadata = metadata
  this.metadata = metadata

  init()

  function init () {
    self.roots.forEach(function (nodeName) {
      var node = self.nodes[nodeName]
      node.handler(self.state, createEdge(nodeName))
    })
  }

  function createEdge (nodeName) {
    return function (edgeName, data) {
      assert.equal(typeof edgeName, 'string', 'buffer-graph.node.createEdge: edgeName should be type string at ' + nodeName + ':' + edgeName)
      assert.equal(Buffer.isBuffer(data), true, 'buffer-graph.node.createEdge: data should be a buffer at ' + nodeName + ':' + edgeName)

      var dataNode = self.state[nodeName]
      var node = self.nodes[nodeName]
      var hash = new Uint8Array(16)
      hash = blake2b(hash.length, self.key).update(data).digest('hex').slice(16)
      // detect if hashes were the same
      var edge = dataNode[edgeName]
      if (edge && hash === edge.hash) return

      dataNode[edgeName] = {
        buffer: data,
        hash: hash
      }

      var dependentNames = node.edges[edgeName] || []
      node.triggered[edgeName] = true

      dependentNames.forEach(function (dependentName) {
        var node = self.nodes[dependentName]
        var handler = node.handler
        var ok = node.dependencies.every(function (dep) {
          var split = dep.split(':')
          var a = split[0]
          var b = split[1]
          var node = self.nodes[a]
          assert.ok(node, 'buffer-graph ' + dependentName + ' relies on non-existant dependency ' + dep)
          return node.triggered[b] === true
        })
        if (ok) handler(self.state, createEdge(dependentName))
      })

      self.emit('change', nodeName, edgeName, self.state)
    }
  }
}

function createNode () {
  return {
    triggered: {},
    edges: {}
  }
}
