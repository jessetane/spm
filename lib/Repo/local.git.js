/*
 *  local.git.js
 *
 */


var fs = require("fs")
var util = require("../util")
var exec = require("child_process").exec


module.exports = LocalGit

function LocalGit (repo) {
  //
}
util.inherits(LocalGit, require("./git"))


//
//  instance
//

LocalGit.prototype.versions = function (cb) {
  cmd = "cd " + this.url + "; git tag"
  exec(cmd, function (err, data) {
    var versions = data.split("\n").slice(0, -1)
    cb(err, [ "HEAD" ].concat(versions.reverse()))
  })
}

LocalGit.prototype.move = function (service, machine, cb) {
  var self = this
  var cmd = machine.ssh() + " '\
  set -e;\
  if [ ! -d " + machine.home + "/src/" + this.name + " ];\
  then\
    mkdir -p " + machine.home + "/src/" + this.name + ";\
    cd " + machine.home + "/src/" + this.name + ";\
    git init --bare;\
  fi;'"
  exec(cmd, function (err) {
    if (err) return cb(err)
    var cmd = "ssh-add " + machine.key + ";\
    cd " + self.url + ";\
    git push -f " + machine.user + "@" + machine.address + ":" + machine.home + "/src/" + self.name + " --all;\
    git push -f " + machine.user + "@" + machine.address + ":" + machine.home + "/src/" + self.name + " --tags"
    exec(cmd, function (err) {
      if (err) cb(err)
      self.remotePull(service, machine, cb)
    })
  })
}
