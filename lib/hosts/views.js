/*
 *  views.js
 *
 */


var cui = require("cui")
var actions = require("./actions")

module.exports = function (config, environment) {
  
  var exports = {}

  exports.actions = {
    title: "actions",
    type: "buttons",
    data: [
      "status"
    ]
  }
}
