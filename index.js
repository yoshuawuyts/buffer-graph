var Emitter = require('events').EventEmitter
var assert = require('assert')
var crypto = require('crypto')

module.exports = BufferGraph

function BufferGraph () {
  if (!(this instanceof BufferGraph)) return new BufferGraph()
  Emitter.call(this)
  this.entries = []
  this.handlers = {}
  this.edges = {}
  this.data = {
    metadata: {}
  }
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
  this.handlers[nodeName] = handler
  this.data[nodeName] = {}

  if (dependencies.length === 0) {
    this.entries.push(nodeName)
  } else {
    dependencies.forEach(function (dependency) {
      var arr = dependency.split(':')
      var a = arr[0]
      var b = arr[1]
      if (!self.edges[a]) self.edges[a] = {}
      if (!self.edges[a][b]) self.edges[a][b] = []
      self.edges[a][b].push(nodeName)
    })
  }

  return this
}

BufferGraph.prototype.start = function (data) {
  assert.ok(this.entries.length, 'buffer-graph.start: no entries detected, cannot start the graph')

  var self = this
  this.data.arguments = data

  this.entries.forEach(function (nodeName) {
    var node = self.handlers[nodeName]
    node(self.data, createEdge(nodeName))
  })
  function createEdge (nodeName) {
    return function (edgeName, data) {
      assert.equal(typeof edgeName, 'string', 'buffer-graph.node.createEdge: edgeName should be type string')
      assert.equal(Buffer.isBuffer(data), true, 'buffer-graph.node.createEdge: data should be a buffer')

      self.data[nodeName][edgeName] = {
        buffer: data,
        hash: hash(data)
      }

      var nodeNames = self.edges[nodeName][edgeName]
      nodeNames.forEach(function (nodeName) {
        var node = self.handlers[nodeName]
        node(self.data, createEdge(nodeName))
      })
    }
  }
}

function hash (buf) {
  return crypto.createHash('sha256').update(buf).digest('hex')
}
