/*
 *  flow.js
 *
 */


var cui = require("cui")
var actions = require("./actions")

module.exports = function (config, environment) {
  
  var views = require("./views")(config, environment)  
  var self = this;
  
  cui.push(views.actions)
  
}