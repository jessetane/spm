#!/usr/bin/env node

/*
 *  command.js
 *
 */

var cui = require('cui')
var async = require('async')
var util = require('../lib/util')
var Service = require('../lib/service')
var config = require(process.cwd() + '/spm')

cui.push(function (cb) {
  util.inflate(config)
  if (Object.keys(config.services).length === 0) {
    throw new Error('to withdraw you must define at least one service')
  } else if (Object.keys(config.machines).length === 0) {
    throw new Error('to withdraw you must define at least one machine')
  }
  cb()
})

cui.push(function(cb) {
  var ops = []
  var machines = Object.keys(config.machines)
  machines.forEach(function(m) {
    var machine = config.machines[m]
    ops.push(function(cb) {
      machine.status(config.services, cb)
    })
  })
  async.parallel(ops, function(err, statuses) {
    var all = []
    for (var s in statuses) {
      all = all.concat(statuses[s])
    }
    var err = null
    if (all.length) {
      cui.splice({
        title: 'ecosystem',
        type: 'buttons',
        categories: [ 'environment', 'machine' ],
        properties: [ 'service', 'status' ],
        data: all
      })
    } else {
      err = new Error('no services are deployed')
    }
    cb(err)
  })
})

cui.push({
  type: 'fields',
  data: 'type a command: '
})

cui.push(function(cb) {
  var view = cui.last(2)
  var parts = view.service.split('@')
  var name = parts[0]
  var version = parts[1]
  var service = new Service(config.services[name])
  service.version = version
  service.machines = [ config.machines[view.machine] ]
  service.command(cui.last(1), function(err, results) {
    if (results[0][0]) console.log('stdout:', results[0][0])
    if (results[0][1]) console.log('stderr:', results[0][1])
    cb()
  })
})
