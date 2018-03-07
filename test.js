var tape = require('tape')
var spok = require('spok')

var bufferGraph = require('./')

tape('should provide initial data', function (assert) {
  assert.plan(2)

  var graph = bufferGraph()
  graph.node('first', function (data, edge) {
    spok(assert, data, {
      metadata: {
        hi: 'kittens'
      }
    })
  })
  graph.start({ hi: 'kittens' })
})

tape('should resolve a graph', function (assert) {
  assert.plan(5)
  var i = 0

  var graph = bufferGraph()
  graph.node('first', function (data, edge) {
    assert.equal(i, 0, 'i = 0')
    i++
    edge('foo', Buffer.from('beep'))
  })

  graph.node('second', [ 'first:foo' ], function (data, edge) {
    spok(assert, data, {
      first: {
        foo: {
          buffer: spok.type('object'),
          hash: spok.type('object')
        }
      }
    })
  })

  graph.start()
})

tape('should resolve a graph with 2 dependencies', function (assert) {
  assert.plan(8)
  var i = 0

  var graph = bufferGraph()
  graph.node('first', function (data, edge) {
    assert.equal(i, 0, 'i = 0')
    i++
    edge('foo', Buffer.from('beep'))
    process.nextTick(function () {
      edge('bar', Buffer.from('boop'))
    })
  })

  graph.node('second', [ 'first:foo', 'first:bar' ], function (data, edge) {
    spok(assert, data, {
      first: {
        foo: {
          buffer: spok.type('object'),
          hash: spok.type('object')
        },
        bar: {
          buffer: spok.type('object'),
          hash: spok.type('object')
        }
      }
    })
  })

  graph.start()
})

tape('emit events on change', function (assert) {
  assert.plan(3)

  var graph = bufferGraph()
  graph.on('change', function (nodeName, edgeName, data) {
    assert.equal(nodeName, 'first', 'nodeName was ok')
    assert.equal(edgeName, 'foo', 'edgeName was ok')
    assert.ok(data[nodeName][edgeName])
  })
  graph.node('first', function (data, edge) {
    edge('foo', Buffer.from('beep'))
  })
  graph.start()
})

tape('retrigger an event on change', function (assert) {
  assert.plan(4)
  var called = false
  var i = 0

  var graph = bufferGraph()
  graph.node('first', function (data, edge) {
    assert.equal(i, 0, 'i = 0')
    i++
    edge('foo', Buffer.from('beep'))
    setTimeout(function () {
      assert.pass('retriggering')
      edge('foo', Buffer.from('boop'))
    }, 100)
  })

  graph.node('second', [ 'first:foo' ], function (data, edge) {
    if (!called) {
      assert.equal(i, 1, 'i = 1')
    } else {
      assert.equal(i, 2, 'i = 2')
    }
    called = true
    i++
  })

  graph.start()
})

tape('should not retrigger an event on change if data is same', function (assert) {
  assert.plan(3)
  var called = false
  var i = 0

  var graph = bufferGraph()
  graph.node('first', function (data, edge) {
    assert.equal(i, 0, 'i = 0')
    i++
    edge('foo', Buffer.from('beep'))
    setTimeout(function () {
      assert.pass('retriggering')
      edge('foo', Buffer.from('beep'))
    }, 100)
  })

  graph.node('second', [ 'first:foo' ], function (data, edge) {
    if (!called) {
      assert.equal(i, 1, 'i = 1')
    } else {
      assert.fail('should not have been called')
    }

    called = true
    i++
  })

  graph.start()
})

tape('should mark blockers on a node', function (assert) {
  assert.plan(12)

  var graph = bufferGraph()
  graph.node('first', function (data, edge) {
    setTimeout(function () {
      edge('foo', Buffer.from('beep'))
    })
  })

  graph.node('second', [ 'first:foo' ], function (data, edge) {
    spok(assert, graph.nodes, {
      first: {
        pending: [],
        dependencies: []
      },
      second: {
        pending: [],
        dependencies: ['first:foo']
      }
    })
  })

  graph.start()
  spok(assert, graph.nodes, {
    first: {
      pending: [],
      dependencies: []
    },
    second: {
      pending: ['first:foo'],
      dependencies: ['first:foo']
    }
  })
})

tape('should attach metadata to edges', function (assert) {
  assert.plan(3)

  var graph = bufferGraph()
  graph.node('first', function (data, edge) {
    edge('foo', Buffer.from('beep'), {
      mime: 'text/plain',
      array: ['array']
    })

    assert.equal(graph.data.first.foo.buffer + '', 'beep')
    assert.equal(graph.data.first.foo.mime, 'text/plain')
    assert.deepEqual(graph.data.first.foo.array, ['array'])
  })

  graph.start()
})
