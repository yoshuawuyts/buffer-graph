var Emitter = require('events').EventEmitter
var assert = require('assert')
var crypto = require('crypto')

module.exports = BufferGraph

function BufferGraph () {
  if (!(this instanceof BufferGraph)) return new BufferGraph()
  Emitter.call(this)

  this.roots = []
  this.nodes = {}
  this.data = {}

  this.data.metadata = {}
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
  this.nodes[nodeName] = {
    dependencies: dependencies,
    handler: handler,
    triggered: {},
    edges: {}
  }
  this.data[nodeName] = {}

  if (dependencies.length === 0) {
    this.roots.push(nodeName)
  } else {
    dependencies.forEach(function (dependency) {
      var arr = dependency.split(':')
      var a = arr[0]
      var b = arr[1]
      if (!self.nodes[a].edges[b]) self.nodes[a].edges[b] = []
      self.nodes[a].edges[b].push(nodeName)
    })
  }

  return this
}

BufferGraph.prototype.start = function (data) {
  assert.ok(this.roots.length, 'buffer-graph.start: no roots detected, cannot start the graph')

  var self = this
  this.data.arguments = data

  this.roots.forEach(function (nodeName) {
    var node = self.nodes[nodeName]
    node.handler(self.data, createEdge(nodeName))
  })

  function createEdge (nodeName) {
    return function (edgeName, data) {
      assert.equal(typeof edgeName, 'string', 'buffer-graph.node.createEdge: edgeName should be type string')
      assert.equal(Buffer.isBuffer(data), true, 'buffer-graph.node.createEdge: data should be a buffer')

      var node = self.data[nodeName]
      var edge = node[edgeName]
      var hash = sha256(data)

      if (edge && hash === edge.hash) return // hashes were the same

      node[edgeName] = {
        buffer: data,
        hash: hash
      }

      var nodeNames = self.nodes[nodeName].edges[edgeName]
      nodeNames.forEach(function (nodeName) {
        var node = self.nodes[nodeName]
        var handler = node.handler
        // TODO: validate all prior constraints have been resolved before triggering
        handler(self.data, createEdge(nodeName))
      })
    }
  }
}

function sha256 (buf) {
  return crypto.createHash('sha256').update(buf).digest('hex')
}
