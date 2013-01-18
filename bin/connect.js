#!/usr/bin/env node

/*
 *  connect.js
 *
 */


var cui = require('cui')
var async = require('async')
var util = require('../lib/util')
var config = require(process.cwd() + '/spm')

cui.push(function (cb) {
  util.inflate(config)  
  //console.log(JSON.stringify(config, true, 2))  // debug
  if (Object.keys(config.machines).length === 0) {
    throw new Error('to connect you must define at least one machine')
  }
  cb()
})

cui.push(function(cb) {
  var view = {
    title: 'machines',
    type: 'buttons',
    data: config.machines
  }
  if (Object.keys(config.environments).length > 0) {
    view.categories = [ 'environment' ]
  }
  cui.splice(view)
  cb()
})

cui.push(function(cb) {
  var machine = cui.last(1)
  machine.connect()
})
