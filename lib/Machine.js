/*
 *  Machine.js
 *
 */

var fs = require('fs')
var cp = require('child_process')
var exec = cp.exec
var spawn = cp.spawn
var async = require('async')
var util = require('./util')

module.exports = Machine

function Machine (props) {
  util._extend(this, props)
  if (!this.home) this.home = '~'
}

Machine.prototype.__defineGetter__('user', function () {
  var name = Object.keys(this.users)[0]
  var key = this.users[name]
  return {
    name: name,
    key: key
  }
})

Machine.prototype.status = function(cb) {
  var self = this
  var cmd = this.ssh() + "'\
  cd " + this.home + "/lib;\
  ls | while read SERVICE;\
  do\
    ls $SERVICE | while read VERSION;\
    do\
      UP=~/.init/\"$SERVICE\"@\"$VERSION\".conf;\
      if [ -e \"$UP\" ];\
      then\
        echo $(status \"$SERVICE\"@\"$VERSION\");\
      else\
        echo \"$SERVICE\"@\"$VERSION\" not/installed;\
      fi\
    done;\
  done;'"
  exec(cmd, function(err, stdout, stderr) {
    if (!err) {
      var statuses = stdout.split('\n').slice(0,-1)
      statuses = statuses.map(function(s) {
        var status = s.split(' ')
        return {
          environment: self.environment,
          machine: self.name,
          service: status[0],
          status: status[1]
        }
      })
    }
    cb(err, statuses)
  })
}

Machine.prototype.isServiceDeployed = function(service, cb) {
  var cmd = this.ssh() + "'\
  if [ -d " + this.home + "/lib/" + service.name + "/" + service.version + " ];\
  then\
    echo -n 1;\
  else\
    echo -n 0;\
  fi;'"
  exec(cmd, function(err, stdout, stderr) {
    cb(err, stdout === '1')
  })
}

Machine.prototype.deploy = function(service, cb) {
  var self = this
  var repo = service.repo
  fs.writeFileSync(repo.url + '/environment', service.packageVariables())
  async.series([
    function(cb) {
      repo.move(service, self, cb)
    },
    function(cb) {
      var local = repo.url + '/environment'
      var destPath = 'lib/' + service.name + '/' + service.version
      var remote = self.user.name + '@' + self.address + ':' + destPath + '/'
      var cmd = 'rsync -auvz --rsync-path=\'mkdir -p ' + destPath + ' && rsync\' ' + local + ' ' + remote
      exec(cmd, function(err, o, e) {
        cb(err)
      })
    }
  ], function(err) {
    if (!err) {
      console.log('SHOULD RUN POST-DEPLOY HOOK NOW', self.name)
      return cb()
      
      // if (repo.hooks && repo.hooks['post-deploy']) {
      //   //console.log('FOUND POST-DEPLOY HOOK:', repo.hooks['post-deploy'])
      //   self.command(repo.hooks['post-deploy'], self.home + '/lib/' + service.name + '/' + service.version, cb)
      // } else {
      //   cb()
      // }
    } else {
      cb(err)
    }
  })
}

Machine.prototype.withdraw = function(service, cb) {
  var cmd = this.ssh() + "'rm -rf " + this.home + "/lib/" + service.name + "/" + service.version + "'"
  exec(cmd, function(err, stdout, stderr) {
    cb(err, stdout === '1')
  })
}

Machine.prototype.command = function(command, directory, cb) {
  if (typeof directory === 'function') {
    cb = directory
    directory = ''
  }
  var cmd = this.ssh() + "'cd " + directory + "; " + command + "'"
  exec(cmd, cb)
}

Machine.prototype.connect = function(service) {
  var args = [
    '-t',
    '-o',
    'StrictHostKeychecking=no',
    '-i',
    this.user.key,
    this.user.name + '@' + this.address
  ]
  if (service) {
    var directory = this.home + '/lib/' + service.name + '/' + service.version
    args.push('cd ' + directory + '; bash')
  }
  spawn('ssh', args, { stdio: 'inherit' })
}

Machine.prototype.ssh = function() {
  return 'ssh -o StrictHostKeychecking=no -i ' + this.user.key + ' ' + this.user.name + '@' + this.address + ' '
}
