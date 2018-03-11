# buffer-graph
[![npm version][2]][3] [![build status][4]][5]
[![downloads][8]][9] [![js-standard-style][10]][11]

Resolve a dependency graph of buffers.

Useful to manage multiple functions that rely on each other, and can recreate
assets on the fly through means such as observing filesystem events.

## Usage
```js
var bufferGraph = require('buffer-graph')

var key = Buffer.from('my very cool graphing key')

var graph = bufferGraph(key)
graph.on('change', function (name, data) {
  console.log(`${nodeName}:${edgeName} changed to ${data[name].hash}`)
})

// Triggers when graph.start() is called
graph.node('first', function (data, edge) {
  console.log('initial data is', data.metadata)
  edge('foo', Buffer.from('beep'))
  setTimeout(function () {
    edge('bar', Buffer.from('boop'))
  }, 100)
})

// Triggers once first:foo and first:bar have been created. Retriggers if
// either dependency changes, and the data has a different hash.
graph.node('second', [ 'first:foo', 'first:bar' ], function (data, edge) {
  console.log('first:foo', data.first.foo)
  console.log('first:bar', data.first.bar)
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

### `graph.node(name, [dependencies], fn(state, edge, metadata))`
Create a new node in the buffer graph.

### `graph.start([metadata])`
Start the graph. Can be passed `metadata` which is set as `state.metadata`.

### `graph.data`
Read out the data from the graph.

### `graph.metadata`
Read out the metadata from the graph.

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
