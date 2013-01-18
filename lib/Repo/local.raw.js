/*
 *  local.raw.js
 *
 */


var fs = require('fs')
var util = require('../util')
var exec = require('child_process').exec


module.exports = Raw

function Raw (repo) {
  //
}
util.inherits(Raw, require('./index'))


//
//  instance
//

Raw.prototype.versions = function(cb) {
  cb(null, [ 'HEAD' ])
}

Raw.prototype.move = function(service, machine, cb) {
  fs.writeFileSync(this.url + '/environment', service.environment)
  var self = this
  var destPath = 'lib/' + service.name + '/' + service.version
  var local = this.url + '/'
  var remote = machine.user + '@' + machine.address + ':' + destPath + '/'
  var cmd = 'rsync -auvz --rsync-path=\'mkdir -p ' + destPath + ' && rsync\' ' + local + ' ' + remote
  exec(cmd, function(err, stdout, stderr) {
    //fs.unlinkSync(self.url + '/environment')
    cb(err, stdout)
  })
}
