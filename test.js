var tape = require('tape')
var spok = require('spok')

var bufferGraph = require('./')

tape('should provide initial data', function (assert) {
  assert.plan(2)

  var graph = bufferGraph()
  graph.node('first', function (data, edge) {
    spok(assert, data, {
      arguments: {
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
          hash: spok.string
        }
      }
    })
  })

  graph.start()
})

// tape('should resolve a graph with 2 dependencies', function (assert) {
//   assert.plan(1)
//   var i = 0

//   var graph = bufferGraph()
//   graph.node('first', function (data, edge) {
//     assert.equal(i, 0, 'i = 0')
//     i++
//     edge('foo', Buffer.from('beep'))
//   })

//   graph.node('second', [ 'first:foo', 'first:bar' ], function (data, edge) {
//     spok(assert, data, {
//       first: {
//         foo: {
//           buffer: spok.buffer,
//           hash: spok.string
//         },
//         bar: {
//           buffer: spok.buffer,
//           hash: spok.string
//         }
//       }
//     })
//   })

//   graph.start()
// })

// tape('emit events on change', function (assert) {
//   assert.plan(3)

//   var graph = bufferGraph()
//   graph.on('change', function (nodeName, edgeName, data) {
//     assert.equal(nodeName, 'first', 'nodeName was ok')
//     assert.equal(edgeName, 'first', 'edgeName was ok')
//     assert.ok(data[nodeName][edgeName])
//   })
//   graph.node('first', function (data, edge) {
//     edge('foo', Buffer.from('beep'))
//   })
//   graph.start()
// })

// tape('retrigger an event on change', function (assert) {
//   assert.plan(4)
//   var called = false
//   var i = 0

//   var graph = bufferGraph()
//   graph.node('first', function (data, edge) {
//     assert.equal(i, 0, 'i = 0')
//     i++
//     edge('foo', Buffer.from('beep'))
//     setTimeout(function () {
//       assert.pass('retriggering')
//       edge('foo', Buffer.from('boop'))
//     }, 100)
//   })

//   graph.node('second', [ 'first:foo' ], function (data, edge) {
//     if (!called) {
//       assert.equal(i, 1, 'i = 1')
//     } else {
//       assert.equal(i, 2, 'i = 2')
//     }
//     called = true
//     i++
//   })

//   graph.start()
// })

// tape('should not retrigger an event on change if data is same', function (assert) {
//   assert.plan(3)
//   var called = false
//   var i = 0

//   var graph = bufferGraph()
//   graph.node('first', function (data, edge) {
//     assert.equal(i, 0, 'i = 0')
//     i++
//     edge('foo', Buffer.from('beep'))
//     setTimeout(function () {
//       assert.pass('retriggering')
//       edge('foo', Buffer.from('beep'))
//     }, 100)
//   })

//   graph.node('second', [ 'first:foo' ], function (data, edge) {
//     if (!called) {
//       assert.equal(i, 1, 'i = 1')
//     } else {
//       assert.fail('should not have been called')
//     }
//     called = true
//     i++
//   })

//   graph.start()
// })