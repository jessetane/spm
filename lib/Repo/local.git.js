/*
 *  Git.js
 *
 */


var fs = require("fs")
var util = require("../util")
var exec = require("child_process").exec


module.exports = Git

function Git (repo) {
  //
}
util.inherits(Git, require("./index"))


//
//  instance
//

Git.prototype.versions = function (cb) {
  cmd = "cd " + this.url + "; git tag"
  exec(cmd, function (err, data) {
    var versions = data.split("\n").slice(0, -1)
    cb(err, [ "HEAD" ].concat(versions.reverse()))
  })
}

Git.prototype.move = function (service, machine, cb) {
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
    cmd = "ssh-add " + machine.key + ";\
    cd " + self.url + ";\
    git push -f " + machine.user + "@" + machine.address + ":" + machine.home + "/src/" + self.name + " --all;\
    git push -f " + machine.user + "@" + machine.address + ":" + machine.home + "/src/" + self.name + " --tags"
    exec(cmd, function (err) {
      if (err) cb(err)
      var src = machine.home + "/src/" + self.name
      var dest = machine.home + "/lib/" + service.name
      cmd = machine.ssh() + " '\
      mkdir -p " + dest + ";\
      cd " + dest + "\
      [ ! -e " + dest + "/" + service.version + " ] && git clone " + src + " " + service.version + ";\
      cd " + dest + "/" + service.version + ";\
      git fetch --all;\
      git fetch --tags;\
      git reset --hard " + service.version + "'"
      exec(cmd, cb)
    })
  })
}
