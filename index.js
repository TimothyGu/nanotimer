exports.promise = function (promise) {
  var time = process.hrtime()
  return promise.then(function (res) {
    return { result: res
           , time: process.hrtime(time)
           }
  }, function (err) {
    throw { err: err
          , time: process.hrtime(time)
          }
  })
}

exports.promiseFunc = function (func) {
  return function (arg) {
    return exports.promise(func.call(undefined, arg))
  }
}

exports.async = function (cb) {
  var time = process.hrtime()
  return function () {
    time = process.hrtime(time)
    var args = [].slice.apply(arguments)
    args.push(time)
    return cb.apply(this, args)
  }
}

exports.sync = function (func) {
  var args = [].slice.call(arguments, 1)
  var time = process.hrtime()
  var res = func.apply(this, args)
  return { result: res
         , time: process.hrtime(time)
         }
}
