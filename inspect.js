#!/usr/bin/env node

/*
 *  inspect.js
 *
 */


var cui = require("cui")
var async = require("async")
var util = require("./lib/util")
var views = require("./lib/views")
var Repo = require("./lib/Repo")
var Service = require("./lib/Service")
var Machine = require("./lib/Machine")

var config = require("./example/services")


cui.push(function (cb) {
  async.parallel([
    function (cb) { Repo.configure(config, cb) },
    function (cb) { Machine.configure(config, cb) }
  ], function (err) {
    cb(err, config.repos)
  })
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

cui.push({
  title: "status",
  type: "buttons",
  properties: [ "service", "status" ],
  categories: [ "environment", "machine" ],
  data: function (cb) {
    var ops = []
    var machines = cui.last(1).machines
    for (var m in machines) {
      var machine = new Machine(machines[m])
      ops.push(function (cb) {
        machine.status(cb)
      })
    }
    async.parallel(ops, function (err, data) {
      if (!err) {
        data = util.flatten(data, 5)
      }
      cb(err, data)
    })
  }
})
