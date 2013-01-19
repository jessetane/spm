/*
 *  git.js
 *
 */

var util = require('util')
var exec = require('child_process').exec
var Repo = require('./')

module.exports = Git

function Git(repo) {}
util.inherits(Git, Repo)

Git.prototype.remotePull = function(service, machine, cb) {
  var src = machine.home + "/src/" + this.name
  var dest = machine.home + "/lib/" + service.name
  cmd = machine.ssh() + " '\
  mkdir -p " + dest + ";\
  cd " + dest + ";\
  [ ! -e " + dest + "/" + service.version + " ] && git clone " + src + " " + service.version + ";\
  cd " + dest + "/" + service.version + ";\
  git fetch --all;\
  git fetch --tags;\
  git reset --hard origin/" + service.version + ";\
  if [ $? != 0 ];\
  then\
    git reset --hard " + service.version + ";\
  fi'"
  exec(cmd, function(err, o, e) {
    service.log('git-remote-pull ' + machine.name, o, e)
    cb(err)
  })
}
