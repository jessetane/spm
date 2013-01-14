/*
 *  remote.git.js
 *
 */


var fs = require('fs')
var util = require('../util')
var exec = require('child_process').exec


module.exports = RemoteGit

function RemoteGit (repo) {
  //
}
util.inherits(RemoteGit, require('./git'))


//
//  instance
//

RemoteGit.prototype.versions  = function(cb) {
  var cmd = 'git ls-remote ' + this.url
  exec(cmd, function(err, refs) {
    var temp = []
    refs && (refs = refs.split('\n').slice(0,-1))
    refs && refs.forEach(function(ref) {
      ref = ref.split('\t')[1].split('tags/')
      if (ref.length === 2) {
        ref = ref[1]
        if (ref.indexOf('^') === -1) {
          temp.push(ref)
        }
      }
    })
    if (temp[0] !== 'HEAD') temp.push('HEAD')
    cb(err, temp)
  })
}

RemoteGit.prototype.move = function(service, machine, cb) {
  var self = this
  var src = machine.home + '/src/' + self.name
  var cmd = machine.ssh() + " '\
  set -e;\
  if [ ! -e " + src + " ];\
  then\
    mkdir " + src + ";\
    cd " + src + ";\
    git init --bare;\
    git remote add origin " + self.url + ";\
  fi;\
  git fetch --all;\
  git fetch --tags;'"
  exec(cmd, function(err) {
    if (err) return cb(err)
    self.remotePull(service, machine, cb)
  })
}
