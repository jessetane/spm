/*
 *  Machine.js
 *
 */


var cp = require('child_process')
var exec = cp.exec
var spawn = cp.spawn
var util = require('./util')


module.exports = Machine


function Machine (props) {
  util._extend(this, props)
  if (!this.home) this.home = '~'
}


//
//  static
//

Machine.configure = function(config, cb) {
  if (!config.machines && !config.environments) {
    cb(new Error('no machines or environments found'))
  } else {
    if (config.machines) {
      config.environments = { 'default': { 'machines': {}}}
    } else {
      config.machines = {}
    }
    for (var e in config.environments) {
      var environment = config.environments[e]
      environment.name = e
      for (var m in environment.machines) {
        var machine = environment.machines[m]
        machine.name = m
        machine.environment = environment.name
        machine = new Machine(machine)
        environment.machines[m] = machine
        config.machines[m] = machine
      }
    }
    cb && cb()
  }
}


//
//  instance
//

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
  repo.move(service, this, function(err) {
    if (!err) {
      if (repo.hooks && repo.hooks['post-deploy']) {
        //console.log('FOUND POST-DEPLOY HOOK:', repo.hooks['post-deploy'])
        self.command(repo.hooks['post-deploy'], self.home + '/lib/' + service.name + '/' + service.version, cb)
      } else {
        cb()
      }
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
    this.key.split('\n')[0],
    this.user + '@' + this.address
  ]
  if (service) {
    var directory = this.home + '/lib/' + service.name + '/' + service.version
    args.push('cd ' + directory + '; bash')
  }
  spawn('ssh', args, { stdio: 'inherit' })
}

Machine.prototype.ssh = function() {
  return 'ssh -o StrictHostKeychecking=no -i ' + this.key + ' ' + this.user + '@' + this.address + ' '
}
