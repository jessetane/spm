#!/usr/bin/env node

/*
 *  deployer.js
 *
 */


var fs = require("fs")
var cui = require("cui")
var util = require("./lib/util")

var config = util.inflate(require(process.cwd() + "/deploy.json"));
fs.writeFileSync("testing", JSON.stringify(config, true, 2)); // debug

cui.push({
  title: "environments",
  type: "buttons",
  data: function (cb) {
    cb(null, config.environments);
  }
})

cui.push({
  title: "resources",
  type: "buttons",
  data: [
    "services",
    "hosts"
  ]
})

cui.push(function (cb) {
  var environment = cui.last(2)
  var resource = cui.last(1)
  if (resource === "services") {
    require("./lib/services/flow")(config, environment)
  } else if (resource === "hosts") {
    require("./lib/hosts/flow")(config, environment)
  }
  cb()
})
