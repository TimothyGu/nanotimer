var test = require('testit')
var assert = require('assert')
var e = assert.strictEqual
var sleep = require('thread-sleep')
var Promise = require('bluebird')
var timer = require('./')

function fuzzyCmp (a, b, targetDev) {
  targetDev = targetDev === undefined ? 0.02 : targetDev // 20 ms
  var lsb = a[1] - b[1]
  var msb = a[0] - b[0]
  var dev = msb + lsb / 1e9
  var abs = Math.abs(dev)
  console.log('     Deviation:', dev, targetDev)
  if (abs > targetDev) {
    throw new Error('Too much deviation: |' + dev + '| > ' + targetDev)
  }
}

test('synchronous', function () {
  test('works', function () {
    fuzzyCmp(timer.sync(function () {
      sleep(500)
    }).timer, [ 0, 5e8 ])
  })
  test('passes return value through', function () {
    var ret = timer.sync(function () {
      sleep(200)
      return 'blah'
    })
    e(ret.result, 'blah')
  })
  test('accepts function arguments', function () {
    var ret = timer.sync(function (str) {
      return str
    }, 'hola')
    e(ret.result, 'hola')
  })
})

test('asynchronous with callback', function () {
  test('works', function (done) {
    setTimeout(timer.async(function (timer) {
      try {
        fuzzyCmp(timer, [ 0, 3e8 ])
      } catch (e) {
        done(e)
      }
      done()
    }), 300)
  })
  test('passes arguments through', function (done) {
    setTimeout(timer.async(function (err, str, timer) {
      try {
        e(err, null)
        e(str, 'blah')
        fuzzyCmp(timer, [ 0, 2e8 ])
      } catch (e) {
        done(e)
      }
      done()
    }), 200, null, 'blah')
  })
})

test('asynchronous with Promise', function () {
  test('works', function () {
    return timer.promise(Promise.delay('human', 300))
    .then(function (res) {
      e(res.result, 'human')
      fuzzyCmp(res.timer, [ 0, 3e8 ])
    })
  })
  test('works with rejection', function () {
    return timer.promise(Promise.delay(250).then(function () {
      throw new Error('weird error')
    })).then(assert.bind(assert, false, 'should fail'), function (res) {
      e(res.err.message, 'weird error')
      fuzzyCmp(res.timer, [ 0, 2.5e8 ])
    })
  })
})

test('asynchronous with Promise function wrapper', function () {
  function handler (arg) {
    return new Promise(function (fulfill, reject) {
      setTimeout(fulfill, 175, arg + ' (enhanced)')
    })
  }
  function handlerReject (arg) {
    return new Promise(function (fulfill, reject) {
      setTimeout(reject, 1289, new Error(arg + ' is weird'))
    })
  }
  test('works', function () {
    return Promise.resolve('human')
    .then(timer.promiseFunc(handler))
    .then(function (res) {
      e(res.result, 'human (enhanced)')
      fuzzyCmp(res.timer, [ 0, 1.75e8 ])
    })
  })
  test('works with rejection', function () {
    return Promise.resolve('weird error')
    .then(timer.promiseFunc(handlerReject))
    .then(assert.bind(assert, false, 'should fail'), function (res) {
      e(res.err.message, 'weird error is weird')
      fuzzyCmp(res.timer, [ 1, 2.89e8 ])
    })
  })
})
