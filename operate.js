#!/usr/bin/env node

/*
 *  operate.js
 *
 */


var cui = require("cui")
var async = require("async")
var util = require("./lib/util")
var views = require("./lib/views")
var Repo = require("./lib/Repo")
var Service = require("./lib/Service")
var Machine = require("./lib/Machine")

var config = null


cui.push({
  title: "pick a repo to deploy",
  type: "buttons",
  data: function (cb) {
    config = require("./example/deploy")
    async.parallel([
      function (cb) { Repo.parse(config, cb) },
      function (cb) { Machine.parse(config, cb) }
    ], function (err) {
      cb(err, config.repos)
    })
  }
})

// versions: if git, commits? tags? manual + HEAD?

cui.push(function (cb) {
  var repo = cui.last(1)
  if (repo.type.indexOf("git") > -1) {
    cui.splice({
      title: "versions",
      type: "buttons",
      data: function (cb) {
        repo.versions(cb)
      }
    })
  } else {
    var v = {
      type: "fields",
      data: "version [HEAD]: ",
      action: function (cb) {
        if (cui.last(1) === undefined) {
          cui.results.splice(-1, 1, "HEAD")
        }
        cb()
      }
    }
    cui.splice(vv)
  }
  cb()
})

/*
cui.push({
  title: "versions",
  type: "buttons",
  data: function (cb) {
    cui.last(1).versions(cb)
  }
})
*/


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
  data: "service name [domain.tld]: "
})

cui.push({
  type: "fields",
  data: "service aliases [www.domain.tld, test.domain.tld]: "
})

cui.push({
  type: "fields",
  data: "service variables [KEY1=VAL1, KEY2=VAL2]: "
})

cui.push(function (cb) {
  var service = new Service({
    repo: cui.last(7),
    version: cui.last(6),
    machines: [ new Machine(cui.last(4)) ],
    name: cui.last(3),
    aliases: cui.last(2),
    variables: cui.last(1)
  })
  cui.results.push(service)
  service.isDeployed(function (err, data) {
    if (!err && data) {
      cui.splice(new views.Confirmation(service))
      cui.splice(function (cb) {
        var err = null
        var answer = cui.last(1)
        cui.results.splice(-1, 1)
        if (answer && answer.toLowerCase().indexOf("y") !== 0) {
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
    if (!err) console.log("deploy succeeded")
    cb(err)
  })
})
