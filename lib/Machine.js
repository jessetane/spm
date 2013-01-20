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

Machine.prototype.status = function(services, cb) {
  var self = this
  var names = ''
  var hooks = ''
  var i = 0
  for (var s in services) {
    var service = services[s]
    names += 'SERVICES[' + i + ']="' + service.name + '";\n'
    hooks += 'HOOKS[' + i++ + ']="' + (service.hooks && service.hooks['status'] || '') + '";\n'
  }
  var cmd = this.ssh() + "'\
  cd " + this.home + "/lib;\
  " + names + "\
  " + hooks + "\
  for SERVICE in \"${SERVICES[@]}\";\
  do\
    if [ -d $SERVICE ];\
    then\
      ls $SERVICE | while read VERSION;\
      do\
        echo \"$SERVICE\"@\"$VERSION\" $(\"$SERVICE\"/\"$VERSION\"/${HOOKS[i]});\
      done\
    fi;\
    ((i++));\
  done'"
  exec(cmd, function(err, o, e) {
    if (!err) {
      var statuses = o.split('\n').slice(0,-1)
      statuses = statuses.map(function(s) {
        var status = s.split(' ')
        return {
          environment: self.environment,
          machine: self.name,
          service: status[0],
          status: status[1] || 'unknown status'
        }
      })
    }
    cb(err, statuses)
  })
}

Machine.prototype.isServiceDeployed = function(service, cb) {
  var cmd = this.ssh() + "'[ -d " + this.home + '/lib/' + service.name + '/' + service.version + " ]; echo -n $?'"
  exec(cmd, function(err, o, e) {
    cb(err, o === '0')
  })
}

Machine.prototype.deploy = function(service, cb) {
  var self = this
  var repo = service.repo
  service.packageVariables()
  this.runHook('pre-deploy', service, function(err) {
    if (err) return cb(err)
    async.series([
      function(cb) {
        repo.move(service, self, cb)
      },
      function(cb) {
        var local = repo.url + '/variables'
        var destPath = 'lib/' + service.name + '/' + service.version
        var remote = self.user.name + '@' + self.address + ':' + destPath + '/'
        var cmd = 'rsync -auvz --rsync-path=\'mkdir -p ' + destPath + ' && rsync\' ' + local + ' ' + remote
        exec(cmd, function(err, o, e) {
          service.log('move-variables ' + self.name, o, e)
          cb(err)
        })
      }
    ], function(err) {
      if (err) return cb(err)
      self.runHook('post-deploy', service, cb)
    })
  })
}

Machine.prototype.withdraw = function(service, cb) {
  var self = this
  this.runHook('pre-withdraw', service, function(err) {
    if (err) return cb(err)
    var cmd = self.ssh() + "'rm -rf " + self.home + '/lib/' + service.name + '/' + service.version + "'"
    exec(cmd, function(err, o, e) {
      service.log('widthdraw ' + self.name, o, e)
      cb(err)
    })
  })
}

Machine.prototype.runHook = function(name, service, cb) {
  var self = this
  var repo = service.repo
  if (repo.hooks && repo.hooks[name]) {
    var cmd = repo.hooks[name]
    self.command(cmd, service, function(err, o, e) {
      service.log(name + ' ' + self.name + ': ' + cmd, o, e)
      cb(err)
    })
  } else {
    cb()
  }
}

Machine.prototype.command = function(command, service, cb) {
  var self = this
  if (typeof service === 'function') {
    cb = service
    service = ''
  } else {
    service = this.home + '/lib/' + service.name + '/' + service.version
  }
  var cmd = this.ssh() + "'cd " + service + '; ' + command + "'"
  exec(cmd, cb)
}

Machine.prototype.connect = function(user, service) {
  if (!user) user = this.user
  var args = [
    '-t',
    '-o',
    'StrictHostKeychecking=no',
    '-i',
    user.key,
    user.name + '@' + this.address
  ]
  if (service) {
    var directory = this.home + '/lib/' + service.name + '/' + service.version
    args.push('cd ' + directory + '; bash')
  }
  spawn('ssh', args, { stdio: 'inherit' })
}

Machine.prototype.ssh = function(user) {
  if (!user) user = this.user
  return 'ssh -o StrictHostKeychecking=no -i ' + user.key + ' ' + user.name + '@' + this.address + ' '
}
