#!/usr/bin/env node

/*
 *  deploy.js
 *
 */

var cui = require('cui')
var util = require('../lib/util')
var Service = require('../lib/service')
var config = require(process.cwd() + '/spm')
var service = null

cui.push(function (cb) {
  util.inflate(config)
  //console.log(JSON.stringify(config, true, 2))  // debug
  if (Object.keys(config.services).length === 0) {
    throw new Error('to deploy you must define at least one service')
  }
  cb()
})

cui.push({
  title: 'services',
  type: 'buttons',
  data: config.services
})

cui.push(function (cb) {
  service = new Service(cui.last(1))
  if (!service.version) {
    cui.splice({
      title: 'versions',
      type: 'buttons',
      data: function(cb) {
        service.repo.versions(cb)
      }
    })
    cui.splice(function (cb) {
      service.version = cui.last(1)
      cb()
    })
  }
  cb()
})

cui.push(function (cb) {
  if (!service.environment) {
    cui.splice({
      title: 'environments',
      type: 'buttons',
      data: config.environments
    })
    cui.splice(function (cb) {
      service.environment = cui.last(1)
      cb()
    })
  } else {
    service.environment = config.environments[service.environment]
  }
  cb()
})

cui.push(function (cb) {
  var machines = service.environment.machines
  service.machines = []
  for (var m in machines) {
    var machine = machines[m]
    if (machine.variables) {
      service.variables = util._extend(machine.variables, service.variables)
    }
    service.machines.push(machine)
  }
  cb()
})

cui.push(function(cb) {
  service.isDeployed(function(err, data) {
    if (!err && data) {
      cui.splice({
        type: 'fields',
        data: service.name + '@' + service.version + ' is already deployed - do you want to overwrite? [Y/n]: '
      })
      cui.splice(function(cb) {
        var err = null
        var answer = cui.last(1)
        cui.results.splice(-1, 1)
        if (answer && answer.toLowerCase().indexOf('y') !== 0) {
          err = new Error('overwrite deploy aborted')
        }
        cb(err)
      })
    }
    cb(err)
  })
})

cui.push(function(cb) {
  service.deploy(function(err) {
    //console.log(service._log)
    if (!err) {
      console.log(service.name + ' deployed successfully to ' + service.machines.map(function(m) { return m.address }).join(' & '))
    }
    cb(err)
  })
})
