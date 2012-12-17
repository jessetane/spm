/*
 *  GitUrl.js
 *
 */


var fs = require("fs")
var util = require("../util")
var exec = require("child_process").exec


module.exports = GitUrl

function GitUrl (repo) {
  //
}
util.inherits(GitUrl, require("./index"))


//
//  instance
//

GitUrl.prototype.versions  = function () {
  var cmd = "git ls-remote " + this.url
  exec(cmd, function (err, refs) {
    var temp = []
    refs && (refs = refs.split("\n").slice(0,-1))
    refs && refs.forEach(function (ref) {
      ref = ref.split("\t")[1].split("tags/")
      if (ref.length === 2) {
        ref = ref[1]
        if (ref.indexOf("^") === -1) {
          temp.push(ref)
        }
      }
    })
    if (temp[0] !== "HEAD") temp.push("HEAD")
    cb(err, temp)
  })
}

GitUrl.prototype.move = function (service, machine, cb) {
  //
}
