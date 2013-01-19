/*
 *  local.raw.js
 *
 */

var fs = require('fs')
var util = require('../util')
var exec = require('child_process').exec
var Repo = require('./')

module.exports = Raw

function Raw (repo) {}
util.inherits(Raw, Repo)

Raw.prototype.versions = function(cb) {
  cb(null, [ 'HEAD' ])
}

Raw.prototype.move = function(service, machine, cb) {
  var self = this
  var destPath = 'lib/' + service.name + '/' + service.version
  var local = this.url + '/'
  var remote = machine.user.name + '@' + machine.address + ':' + destPath + '/'
  var cmd = 'rsync -auvz --rsync-path=\'mkdir -p ' + destPath + ' && rsync\' ' + local + ' ' + remote
  exec(cmd, function(err, o, e) {
    service.log('raw-local-move ' + machine.name, o, e)
    cb(err)
  })
}
