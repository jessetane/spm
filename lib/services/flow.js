/*
 *  flow.js
 *
 */


var cui = require("cui")
var actions = require("./actions")

module.exports = function (config, environment) {
  
  var views = require("./views")(config, environment)  
  var self = this;
  
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
        self[action](service, cb)
      } catch (err) {
        actions[action](environment, service, cb)
      }
    })
  }
  
  self.deploy = function () {
    cui.push(views.deploy)
    cui.push(views.versions)
    cui.push(function (cb) {
      var service = cui.last(2)
      var version = cui.last(1)
      actions.deploy(environment, service, version, cb)
    })
  }
  
  self.command = function (service, cb) {
    cui.push(views.command)
    actions.command(environment, service, cui.last(1), cb)
  }
}
