/*
 *  local.git.js
 *
 */

var fs = require('fs')
var util = require('../util')
var exec = require('child_process').exec
var Git = require('./git')

module.exports = LocalGit

function LocalGit (repo) {}
util.inherits(LocalGit, Git)

LocalGit.prototype.versions = function(cb) {
  cmd = 'cd ' + this.url + '; git tag'
  exec(cmd, function(err, o, e) {
    var versions = o.split('\n').slice(0, -1)
    cb(err, [ 'HEAD' ].concat(versions.reverse()))
  })
}

LocalGit.prototype.move = function(service, machine, cb) {
  var self = this
  var cmd = machine.ssh() + " '\
  set -e;\
  if [ ! -d " + machine.home + "/src/" + this.name + " ];\
  then\
    mkdir -p " + machine.home + "/src/" + this.name + ";\
    cd " + machine.home + "/src/" + this.name + ";\
    git init --bare;\
  fi;'"
  exec(cmd, function(err, o, e) {
    service.log('git-local-move-prep ' + machine.name, o, e)
    if (err) return cb(err)
    var cmd = 'cd ' + self.url + ';\
    git push -f ' + machine.user.name + '@' + machine.address + ':' + machine.home + '/src/' + self.name + ' --all;\
    git push -f ' + machine.user.name + '@' + machine.address + ':' + machine.home + '/src/' + self.name + ' --tags'
    if (machine.user.key) {
      
      // HACK: only let the added key be valid for the next 60 seconds.
      // ideally we would tell git-push explictly which key to use, and 
      // avoid using ssh-add altogether, however I couldn't figure out
      // how to do this and it's gross to make programs that use this
      // class deal with handling the ssh-agent.
      cmd = '! ssh-add -l | grep -q "' + machine.user.key + '" && ssh-add -t 60 ' + machine.user.key + '; ' + cmd
    }
    exec(cmd, function(err, o, e) {
      service.log('git-local-move ' + machine.name, o, e)
      if (err) return cb(err)
      self.remotePull(service, machine, cb)
    })
  })
}
