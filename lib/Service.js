/*
 *  Service.js
 *
 */


var util = require("./util")
module.exports = Service


function Service (props) {
  util._extend(this, props)
}
