# buffer-graph [![stability][0]][1]
[![npm version][2]][3] [![build status][4]][5]
[![downloads][8]][9] [![js-standard-style][10]][11]

Resolve a dependency graph (DAG) of functions that create Buffers.

## Usage
```js
var bufferGraph = require('buffer-graph')

var graph = bufferGraph()
graph.on('change', function (nodeName, edgeName, state) {
  console.log(`${nodeName}:${edgeName} changed to ${state[name].hash}`)
})

// Triggers when graph.start() is called
graph.node('first', function (state, edge) {
  console.log('initial state is', state.arguments)
  edge('foo', Buffer.from('beep'))
  setTimeout(function () {
    edge('bar', Buffer.from('boop'))
  }, 100)
})

// Triggers once first:foo and first:bar have been created. Retriggers if
// either dependency changes, and the state has a different hash.
graph.node('second', [ 'first:foo', 'first:bar' ], function (state, edge) {
  console.log('first:foo', state.first.foo)
  console.log('first:bar', state.first.bar)
  edge('baz', Buffer.from('berp'))
})

graph.start({ hi: 'kittens' })
```

## Events
### `graph.on('change', name, state)`
Emitted whenever an edge in the graph is updated.

## API
### `graph = bufferGraph()`
Create a new `buffer-graph` instance. Inherits from Node's
`events.EventEmitter` module.

### `graph.node(name, [dependencies], fn(state, edge))`
Create a new node in the buffer graph.

### `graph.start([arguments])`
Start the graph. Can be passed `arguments` which is set as `state.arguments`

## License
[MIT](https://tldrlegal.com/license/mit-license)

[0]: https://img.shields.io/badge/stability-experimental-orange.svg?style=flat-square
[1]: https://nodejs.org/api/documentation.html#documentation_stability_index
[2]: https://img.shields.io/npm/v/buffer-graph.svg?style=flat-square
[3]: https://npmjs.org/package/buffer-graph
[4]: https://img.shields.io/travis/yoshuawuyts/buffer-graph/master.svg?style=flat-square
[5]: https://travis-ci.org/yoshuawuyts/buffer-graph
[6]: https://img.shields.io/codecov/c/github/yoshuawuyts/buffer-graph/master.svg?style=flat-square
[7]: https://codecov.io/github/yoshuawuyts/buffer-graph
[8]: http://img.shields.io/npm/dm/buffer-graph.svg?style=flat-square
[9]: https://npmjs.org/package/buffer-graph
[10]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[11]: https://github.com/feross/standard
