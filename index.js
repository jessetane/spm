#!/usr/bin/env node

/*
 *  index.js
 *
 */


// deploy - automated deployment based on service entry
// inspect - status report
// operate - manually deploy a repo


var cui = require("cui")

cui.push({
  title: "action",
  type: "buttons",
  data: [
    "deploy",
    "inspect",
    "operate"
  ]
})

cui.push(function (cb) {
  var command = cui.last(1)
  require("./" + command)
  cb()
})