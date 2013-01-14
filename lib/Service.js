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
    var vars = this.variables.split(',')
    this.variables = {}
    for (var v in vars) {
      var parts = vars[v].split('=')
      this.variables[parts[0]] = parts[1]
    }
  }
  if (typeof this.aliases === 'string') {
    var aliases = this.aliases.split(',')
    this.aliases = []
    for (var a in aliases) {
      this.aliases.push(aliases[a].replace(/^\s\s*/, '').replace(/\s\s*$/, ''))
    }
  }
}


//
//  static
//


Service.configure = function(config, cb) {
  //
}


//
//  instance
//

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
