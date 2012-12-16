#!/usr/bin/env node

/*
 *  deploy.js
 *
 */


var cui = require("cui")
var async = require("async")
var views = require("./lib/views")
var Repo = require("./lib/Repo")
var Machine = require("./lib/Machine")

var config = null


cui.push({
  title: "pick a repo to deploy",
  type: "buttons",
  data: function (cb) {
    config = require("./example/deploy")
    // TODO: normalize
    // config.services.machines
    // config.services.environments
    async.parallel([
      function (cb) { Repo.parse(config, cb) },
      function (cb) { Machine.parse(config, cb) }
    ], function (err) {
      cb(err, config.repos)
    })
  }
})

cui.push({
  title: "versions",
  type: "buttons",
  data: function (cb) {
    cui.last(1).versions(cb)
  }
})

cui.push(function (cb) {
  var environments = config.environments
  var keys = Object.keys(environments)
  if (keys.length > 1) {
    cui.splice(new views.Environments(environments))
  } else {
    cui.results.push(environments[keys[0]])
  }
  cb()
})

cui.push(function (cb) {
  var machines = cui.last(1).machines
  var keys = Object.keys(machines)
  if (keys.length > 1) {
    cui.splice(new views.Machines(machines))
  } else {
    cui.results.push(machines[keys[0]])
  }
  cb()
})

cui.push({
  type: "fields",
  data: "service name: "
})

cui.push({
  type: "fields",
  data: "service aliases: "
})

cui.push(function (cb) {
  var serviceName = cui.last(2)
  var serviceConf = config.services[serviceName]
  var props = util._extend(serviceConf || {}, {
    repo: cui.last(6),
    version: cui.last(5),
    machines: [ cui.last(3) ],
    name: serviceName,
    aliases: cui.last(1)
  })
  var service = new Service(props)
  cui.results.push(service)
  service.isDeployed(function (err, data) {
    if (!err && data) {
      cui.splice(new views.Confirmation(service))
      cui.splice(function (cb) {
        var err = null
        if (cui.last(1).toLowerCase().indexOf("y") !== 0) {
          err = new Error("overwrite deploy aborted")
        }
        cb(err)
      })
    }
    cb(err)
  })
})

cui.push(function (cb) {
  var service = cui.last(1)
  service.deploy(function (err, data) {
    if (!err) console.log("deploy succeeded:", data)
    cb(err)
  })
})
