#!/usr/bin/env node

/*
 *  withdraw.js
 *
 */

var cui = require('cui')
var util = require('../lib/util')
var config = require(process.cwd() + '/spm')

cui.push(function (cb) {
  util.inflate(config)
  console.log(JSON.stringify(config, true, 2))
  cb()
})