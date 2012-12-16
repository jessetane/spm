/*
 *  Service.js
 *
 */


var util = require("./util")
var async = require("async")


module.exports = Service


function Service (props) {
  util._extend(this, props)
}


//
//  instance
//

Service.prototype.status = function () {
  
}

Service.prototype.command = function () {
  var self = this
  var ops = []
  this.machines.forEeach(function (machine) {
    var home = machine.home + "/lib/" + self.name + "/" + self.version
    ops.push(function (cb) {
      machine.command(self, home, cb)
    })
  })
  async.parallel(ops, cb)
}

Service.prototype.isDeployed = function (cb) {
  var self = this
  var ops = []
  this.machines.forEeach(function (machine) {
    ops.push(function (cb) {
      machine.isServiceDeployed(self, cb)
    })
  })
  async.parallel(ops, function (err, results) {
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

Service.prototype.deploy = function (cb) {
  var self = this
  var ops = []
  this.machines.forEeach(function (machine) {
    ops.push(function (cb) {
      machine.deploy(self, cb)
    })
  })
  async.parallel(ops, cb)
}
