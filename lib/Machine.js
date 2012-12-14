/*
 *  Machine.js
 *
 */


module.exports = Machine


function Machine (props) {
  util._extend(this, props)
}


//
//  static
//

Machine.parse = function (config, cb) {
  var err = null
  var machines = config.machines
  var environments = config.environments
  if (machines) {
    config.environments = { "default": { "machines": {}}}
    for (var m in machines) {
      config.environments.default.machines[m] = new Machine(util._extend(machines[m], { name: m }))
    }
  } else if (environments) {
    for (var e in environments) {
      var environment = environments[e]
      for (var m in e.machines) {
        var machine = e.machines[m]
        machine.name = m
        e.machines[m] = new Machine(machine)
      }
    }
  } else {
    err = new Error("no machines or environments found")
  }
  cb(err)
}

Machine.each = function (operation, cb) {
  
}


//
//  instance
//

Machine.prototype.status = function (service, cb) {
  
}

Machine.prototype.deploy = function (repo, service, cb) {
  
}

Machine.prototype.withdraw = function (service, cb) {
  
}

Machine.prototype.updateDNS = function (service, cb) {
  
}

Machine.prototype.connect = function (directory) {
  
}

Machine.prototype.command = function (directory, cb) {
  
}
