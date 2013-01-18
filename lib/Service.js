/*
 *  Service.js
 *
 */

var util = require('./util')
var async = require('async')

module.exports = Service

function Service (props) {
  util._extend(this, props)
  if (typeof this.variables === 'string') {
    
    // if we collected variables via cui field they may be in a string
    var vars = this.variables.split(',')
    this.variables = {}
    for (var v in vars) {
      var parts = util.trim(vars[v]).split('=')
      this.variables[parts[0]] = parts[1]
    }
  } else {
  
    // make sure we don't have any arrays - they should be tab delimited strings
    for (var key in this.variables) {
      var v = this.variables[key]
      if (Array.isArray(v)) {
        this.variables[key] = v.join('\t')
      }
    }
  }
}

Service.prototype.status = function() {
  //
}

Service.prototype.command = function() {
  var self = this
  var ops = []
  this.machines.forEach(function(machine) {
    var home = machine.home + '/lib/' + self.name + '/' + self.version
    ops.push(function(cb) {
      machine.command(self, home, cb)
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

Service.prototype.widthdraw = function(cb) {
  var self = this
  var ops = []
  this.machines.forEach(function(machine) {
    ops.push(function(cb) {
      machine.deploy(self, cb)
    })
  })
  async.parallel(ops, cb)
}

Service.prototype.__defineGetter__('environment', function() {
  var env = ''
  var variables = this.variables || {}
  util._extend(variables, this.repo.variables)
  variables.SERVICE = this.name
  variables.VERSION = this.version
  variables.ALIASES = this.aliases && this.aliases.join('\t ') || this.aliases
  for (var v in variables) {
    env += 'export ' + v + '=' + variables[v] + '\n'
  }
  return env
})
