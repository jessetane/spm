#!/usr/bin/env node

/*
 *  two.js
 *
 */


var http = require("http")
var server = http.createServer(function (req, res) {
  console.log(req.headers.host)
  res.end(process.env.MSG)
})
server.listen(process.env.PORT)
console.log(process.env.PORT)