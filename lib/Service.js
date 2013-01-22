/*
 *  Service.js
 *
 */

var fs = require('fs')
var util = require('./util')
var async = require('async')

module.exports = Service

function Service (props) {
  this._log = []
  util._extend(this, props)
  for (var key in this.variables) {
    var v = this.variables[key]
    if (Array.isArray(v)) {
      this.variables[key] = v.join('\t')
    }
  }
}

Service.prototype.log = function(title, stdout, stderr) {
  this._log.push({
    title: title,
    stdout: stdout,
    stderr: stderr
  })
}

Service.prototype.status = function(version, cb) {
  if (typeof version === 'function') {
    cb = version
  }
  var ops = []
  this.machines.forEach(function(machine) {
    ops.push(function(cb) {
      machine.status(services, cb)
    })
  })
  async.parallel(ops, cb)
}

Service.prototype.command = function(command, cb) {
  var self = this
  var ops = []
  this.machines.forEach(function(machine) {
    ops.push(function(cb) {
      machine.command(command, self, cb)
    })
  })
  async.parallel(ops, cb)
}

Service.prototype.isDeployed = function(cb) {
  var self = this
  var ops = []
  this.machines.forEach(function(machine) {
    ops.push(function(cb) {
      machine.isServiceDeployed(self, cb)
    })
  })
  async.parallel(ops, function(err, results) {
    if (!err) {
      var existing = false
      for (var r in results) {
        existing = results[r]
        if (existing) {
          break;
        }
      }
    }
    cb(err, existing)
  })
}

Service.prototype.deploy = function(cb) {
  var self = this
  var ops = []
  this.machines.forEach(function(machine) {
    ops.push(function(cb) {
      machine.deploy(self, cb)
    })
  })
  async.parallel(ops, cb)
}

Service.prototype.withdraw = function(cb) {
  var self = this
  var ops = []
  this.machines.forEach(function(machine) {
    ops.push(function(cb) {
      machine.withdraw(self, cb)
    })
  })
  async.parallel(ops, cb)
}

Service.prototype.packageVariables = function() {
  var packaged = ''
  var variables = this.variables || {}
  variables.NAME = this.name
  variables.VERSION = this.version
  for (var v in variables) {
    packaged += 'export ' + v + '=' + variables[v] + '\n'
  }
  fs.writeFileSync(this.repo.url + '/variables', packaged)
}
