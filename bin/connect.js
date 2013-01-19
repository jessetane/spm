#!/usr/bin/env node

/*
 *  connect.js
 *
 */

var cui = require('cui')
var async = require('async')
var util = require('../lib/util')
var config = require(process.cwd() + '/spm')
var machine = null
var user = null

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
  machine = cui.last(1)
  var users = Object.keys(machine.users)
  if (users.length > 0) {
    cui.splice({
      title: 'users',
      type: 'buttons',
      data: users
    })
  }
  cb()
})

cui.push(function(cb) {
  if (cui.results.length > 1) {
    var name = cui.last(1)
    user = {
      name: name,
      key: machine.users[name]
    }
  }
  machine.connect(user)
  cb()
})
