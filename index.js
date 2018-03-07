var Emitter = require('events').EventEmitter
var assert = require('assert')
var crypto = require('crypto')

module.exports = BufferGraph

function BufferGraph () {
  if (!(this instanceof BufferGraph)) return new BufferGraph()
  Emitter.call(this)

  this.roots = []  // nodes that should be resolved when .start() is called
  this.nodes = {}  // references to all nodes, keeps state except "data"
  this.data = {}   // data that is passed into each node

  this.metadata = {}  // non-buffer metadata, does not cause triggers
  this.data.metadata = this.metadata
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
  node.pending = dependencies.slice() // copy array
  node.handler = handler.bind(this)

  this.data[nodeName] = {}

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
  this.data.metadata = metadata
  this.metadata = metadata

  init()

  function init () {
    self.roots.forEach(function (nodeName) {
      var node = self.nodes[nodeName]
      node.handler(self.data, createEdge(nodeName))
    })
  }

  function createEdge (nodeName) {
    return function (edgeName, data, metadata) {
      assert.equal(typeof edgeName, 'string', 'buffer-graph.node.createEdge: edgeName should be type string at ' + nodeName + ':' + edgeName)
      assert.equal(Buffer.isBuffer(data), true, 'buffer-graph.node.createEdge: data should be a buffer at ' + nodeName + ':' + edgeName)
      assert(metadata == null || typeof metadata === 'object', 'buffer-graph.node.createEdge: metadata should be an object at ' + nodeName + ':' + edgeName)
      if (metadata) {
        assert.equal(metadata.buffer, undefined, 'buffer-graph.node.createEdge: metadata may not have a buffer property at ' + nodeName + ':' + edgeName)
        assert.equal(metadata.hash, undefined, 'buffer-graph.node.createEdge: metadata may not have a hash property at ' + nodeName + ':' + edgeName)
      }

      var dataNode = self.data[nodeName]
      var node = self.nodes[nodeName]
      var hash = sha512(data)
      // detect if hashes were the same
      var edge = dataNode[edgeName]
      if (edge && hash.equals(edge.hash)) return

      dataNode[edgeName] = Object.assign({
        buffer: data,
        hash: hash
      }, metadata)

      var dependentNames = node.edges[edgeName] || []
      node.triggered[edgeName] = true

      dependentNames.forEach(function (dependentName) {
        var node = self.nodes[dependentName]
        removeFromArray(node.pending, nodeName + ':' + edgeName)
        var handler = node.handler
        var ok = node.pending.length === 0
        if (ok) handler(self.data, createEdge(dependentName))
      })

      self.emit('change', nodeName, edgeName, self.data)
    }
  }
}

function sha512 (buf) {
  return crypto.createHash('sha512')
    .update(buf)
    .digest('buffer')
}

function createNode () {
  return {
    triggered: {},
    edges: {}
  }
}

function removeFromArray (arr, str) {
  var index = arr.indexOf(str)
  if (index === -1) return
  arr.splice(index, 1)
}
