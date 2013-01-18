#!/usr/bin/env node

/*
 *  operate.js
 *
 */


var cui = require('cui')
var async = require('async')
var util = require('./lib/util')
var views = require('./lib/views')
var Repo = require('./lib/Repo')
var Service = require('./lib/Service')
var Machine = require('./lib/Machine')

var config = require(process.cwd() + '/deploy.json')

cui.push(function(cb) {
  Machine.configure(config, cb)
})

cui.push(function(cb) {
  var envCount = Object.keys(config.environments).length  
  cui.splice(new views.Machines(config.machines, envCount))
  cb()
})

cui.push(function(cb) {
  var machine = cui.last(1)
  machine.connect()
})