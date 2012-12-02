/*
 *  views.js
 *
 */


var cui = require("cui")
var actions = require("./actions")

module.exports = function (config, environment) {
  
  var exports = {}

  exports.actions = {
    title: "actions",
    type: "buttons",
    data: [
      "status",
      "deploy"
    ]
  }

  exports.status = {
    title: "status",
    type: "buttons",
    categories: [ "host" ],
    properties: [ "name", "status" ],
    data: function (cb) {
      actions.status(environment, function (err, data) {
        if (data.length) {
          cb(null, data)
        } else {
          console.log("No services found in", environment.name)
        }
      })
    }
  }

  exports.manage = {
    title: "manage",
    type: "buttons",
    data: [
      "command",
      "connect",
      "withdraw"
    ]
  }

  exports.deploy = {
    title: "deploy",
    type: "buttons",
    data: config.services
  }
  
  exports.versions = {
    title: "versions",
    type: "buttons",
    data: function (cb) {
      var service = cui.last(1)
      actions.versions(service, cb)
    }
  }

  exports.command = {
    title: "command",
    type: "fields",
    data: "type a shell command: "
  }

  exports.hosts = {
    title: "hosts",
    type: "buttons",
    data: environment.hosts
  }
  
  return exports;
}
