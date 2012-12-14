/*
 *  util.js
 *
 */


var async = require("async")
var util = require("util")
util._extend(exports, util)


exports.flatten = function (arrayOfArrays, depth, removeFalsy) {
  if (Array.isArray(arrayOfArrays)) {
    var temp = []
    for (var a in arrayOfArrays) {
      var array = arrayOfArrays[a]
      if (depth) {
        array = exports.flatten(array, depth-1, removeFalsy)
      } else if (depth !== undefined) {
        array = exports.flatten(array, undefined, removeFalsy)
      }
      temp = temp.concat(array)
    }
    arrayOfArrays = temp
  }
  if (removeFalsy && !arrayOfArrays) arrayOfArrays = []
  return arrayOfArrays
}
