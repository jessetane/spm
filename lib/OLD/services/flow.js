/*
 *  flow.js
 *
 */


var cui = require("cui")
var actions = require("./actions")

module.exports = function (config, environment) {
  
  var views = require("./views")(config, environment)  
  var self = this
  
  cui.push(views.actions)
  cui.push(function (cb) {
    var action = cui.last(1)
    self[action]()
    cb()
  })
  
  self.status = function () {
    cui.push(views.status)
    cui.push(views.manage)
    cui.push(function (cb) {
      var service = cui.last(2)
      var action = cui.last(1)
      try {
        self[action](service)
        cb()
      } catch (err) {
        actions[action](environment, service, cb)
      }
    })
  }
  
  self.deploy = function () {
    cui.push(views.services)
    cui.push(function (cb) {
      var service = cui.last(1)
      cui.push(views.versions(service))
      cui.push(views.hosts)
      cui.push(function (cb) {
        var version = cui.last(2)
        var host = cui.last(1)
        actions.prepareDeploy(host, service, version, function (err, data) {
          if (!err) {
            if (data == 1) {
              cui.push(views.confirmOverwrite(service, host, version))  // service@version exists, so confirm overwrite
              cui.push(function (cb) {
                var err = null
                var answer = cui.last(1)
                if (answer && answer.toLowerCase().indexOf("n") === 0) {
                  err = new Error("Deploy aborted")
                }
                runDeploy(host, service, version)
                cb(err)
              })
            } else {
              runDeploy(host, service, version)
            }
          }
          cb(err)
        })
      })
      cb()
    })
  }
  
  self.runDeploy = function (host, service, version) {
    cui.push(function (cb) {
      actions.updateVhosts(environment, host, service, cb)
    })
    cui.push(function (cb) {
      actions.deploy(host, service, version, function () {
        cb()
      })
    })
  }
  
  self.command = function (service, cb) {
    cui.push(views.command)
    cui.push(function (cb) {
      var command = cui.last(1)
      actions.command(environment, service, command, cb)
    })
  }
}
