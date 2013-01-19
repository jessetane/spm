#!/usr/bin/env node

/*
 *  index.js
 *
 */

var cui = require('cui')

cui.push({
  title: 'action',
  type: 'buttons',
  data: [
    'deploy',
    'withdraw',
    'command',
    'connect'
  ]
})

cui.push(function(cb) {
  var command = cui.last(1)
  require('./bin/' + command)
  cb()
})
