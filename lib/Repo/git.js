/*
 *  Git.js
 *
 */


var util = require('../util')
var exec = require('child_process').exec


module.exports = Git

function Git(repo) {
  //
}
util.inherits(Git, require('./index'))


//
//  instance
//

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
  git reset --hard origin/" + service.version + "'"
  exec(cmd, cb)
}
