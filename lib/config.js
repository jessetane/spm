/*
 *  config.js
 *
 */


var fs = require("fs");
var util = require("./util");

var config = util.inflateConfig(require(process.cwd() + "/deploy.json"));

// debug
fs.writeFileSync("testing", JSON.stringify(config, true, 2));

module.exports = config;
