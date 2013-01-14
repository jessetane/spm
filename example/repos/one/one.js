#!/usr/bin/env node

/*
 *  one.js
 *
 */


var http = require('http')
var server = http.createServer(function(req, res) {
  console.log(req.headers.host)
  res.end('hi!')
})
server.listen(process.env.PORT)
console.log(process.env.PORT)