/*
 *  views.js
 *
 */


//var cui = require("cui")
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
    categories: [ "hostname" ],
    properties: [ "servicename", "status" ],
    data: function (cb) {
      actions.status(environment, function (err, data) {
        if (err || !data.length) {
          err = new Error("No services found in " + environment.name)
        }
        cb(err, data)
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

  exports.services = {
    title: "deploy",
    type: "buttons",
    data: config.services
  }

  exports.versions = function (service) {
    return {
      title: "versions",
      type: "buttons",
      data: function (cb) {
        actions.versions(service, cb)
      }
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
  
  exports.confirmOverwrite = function (host, service, version) {
    return {
      type: "fields",
      data: service.name + "@" + version + " already exists on " + host.name + ", do you want to overwrite? [Y/n]: "
    }
  }
  
  return exports
}
