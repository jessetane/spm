/*
 *  index.js (Repo.js)
 *
 */


var fs = require("fs")
var util = require("../util")
var exec = require("child_process").exec
var path = require("path")
var async = require("async")
var urllib = require("url")
var request = require("request")


module.exports = Repo

function Repo (props) {
  var klass = require("./" + props.type)
  var instance = new klass
  return util._extend(instance, props)
}


//
//  static
//

Repo.configure = function (config, cb) {
  for (var r in config.repos) {
    var repo = config.repos[r]
    if (typeof repo !== "object") {
      repo = { url: repo }
    }
    var temp = urllib.parse(repo.url)
    repo.type = temp.protocol && temp.protocol.slice(0,-1) || "local.raw"
    repo.name = r
    if (repo.type === "git" ||
        repo.type === "http" || 
        repo.type === "https") {
      repo.type = "remote.git"
    } else {
      try {
        var git = fs.statSync(repo.url + "/.git").isDirectory()
        if (git) repo.type = "local.git"
      } catch (err) {}
    }
    config.repos[r] = new Repo(repo)
  }
  cb()
}


//
//  instance
//

Repo.prototype.versions = function (cb) {
  cb(new Error("not implemented"))
}

Repo.prototype.move = function (cb) {
  cb(new Error("not implemented"))
}
