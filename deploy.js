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
  data: "service domain: "
})

cui.push({
  type: "fields",
  data: "service aliases: "
})

cui.push(function (cb) {
  var repo = cui.last(6)
  var version = cui.last(5)
  var machine = cui.last(3)
  var domain = cui.last(2)
  console.log("\nexists?:")
  console.log(repo)
  console.log(version)
  console.log(machine)
  console.log(domain, "\n")
  cb()
})

cui.push(function (cb) {
  var environment = cui.last(4)
  var machine = cui.last(3)
  var domain = cui.last(2)
  var aliases = cui.last(1)
  console.log("update dns:")
  console.log(environment)
  console.log(machine)
  console.log(domain)
  console.log(aliases, "\n")
  cb()
})

cui.push(function (cb) {
  var repo = cui.last(6)
  var version = cui.last(5)
  var machine = cui.last(3)
  var domain = cui.last(2)
  console.log("move code:")
  console.log(repo)
  console.log(version)
  console.log(machine)
  console.log(domain, "\n")
  cb()
})
