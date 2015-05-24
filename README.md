nanotimer
=========

> Nanosecond precision stopwatch for synchronous, asynchrous, and
> Promise-returning functions, using [`process.hrtime()`][1].

[1]: https://nodejs.org/api/process.html#process_process_hrtime

```js
var timer = require('nanotimer')
```

Time format
-----------

The returned `time` property or variable has the following structure:

```js
   [       0,   123456789 ]
// [ seconds, nanoseconds ]
```

To convert this to seconds, do this:

```js
var sec = time[0] + time[1] / 1e9
```

To milliseconds:

```js
var ms = time[0] * 1e3 + time[1] / 1e6
```

Synchronous function: `timer.sync`
----------------------------------

```js
timer.sync(function[, args]) => { result, time }
```

Example:

```js
timer.sync(function () {
  var i = 0
  while (i < 1000000000) i ++
})
// => { result: undefined, time: [ 1, 272903531 ] }

timer.sync(function (myArg) {
  var i = 0
  while (i < 1000000000) i ++
  return myArg + ' is cool'
}, 'Timothy')
// => { result: 'Timothy is cool', time: [ 1, 277721967 ] }
```

Asynchronous function with callbacks: `timer.async`
---------------------------------------------------

```js
myAsyncFunction(args,             function callback (usualArgs      ) )
//                    ++++++++++++                            ++++++ +
myAsyncFunction(args, timer.async(function callback (usualArgs, time)))
```

`timer.async` wraps a callback, calling it with one more argument, `time`.

Examples:

```js
// Old:
fs.readFile('my-file', 'utf8',             function (err, data      ) {
  if (err) return console.error('Eeeaash', err)
  console.log('Your file is:')
  console.log(data)
})

// New:
fs.readFile('my-file', 'utf8', timer.async(function (err, data, time) {
  console.log('Reading your file took', time[0] + time[1] / 1e9, 'seconds')
  if (err) return console.error('Eeeaash', err)
  console.log('Your file is:')
  console.log(data)
}))
```

Asynchronous function returning Promises: `timer.promise`
-------------------------------------------

```js
timer.promise(Promise) => Promise => { result/err, time }
```

Takes a Promise as argument, returning a Promise that either resolves to
`{ result, time }`, with `result` the value of the original Promise, or
`{ err, time }`, with `err` the reason for rejection of the original Promise.

Examples:

```js
timer.promise(new Promise(function (fulfill, reject) {
  setTimeout(fulfill, 200, 1)
})).then(console.log.bind(console))
// => Prints { result: 1, time: [ 0, 204734279 ] }

timer.promise(new Promise(function (fulfill, reject) {
  setTimeout(reject, 200, new Error('this is bad'))
})).then(null, console.log.bind(console))
// => Prints { err: [Error: this is bad], time: [ 0, 202782629 ] }
```

Asynchronous with Promise-returning functions: `timer.promiseFunc`
------------------------------------------------------------------

```js
timer.promiseFunc(function => Promise) => function => Promise => { result/err, time }
```

This is a syntactic sugar for:

```js
promise.then(function (value) {
  timer.promise(function () {
    // do something with value
    return anotherPromise
  })
}, function (err) {
  timer.promise(function () {
    // do something with err
    return anotherPromise
  })
})
```

Now you can do:

```js
promise.then(timer.promiseFunc(function (value) {
  // do something with value
  return anotherPromise
}), timer.promiseFunc(function (err) {
  // do something with err
  return anotherPromise
}))
```

Examples:

```js
// In the following example, fs.readFileAsync returns a promise rather than
// using callbacks. It is equivalent to the result of Bluebird's
// `promisifyAll`.

Promise.resolve('this-is-a-file')
.then(timer.promiseFunc(fs.readFileAsync))
.then(function (val) {
  var result = val.result.toString()
  var time   = val.time
  // ...
})
```
