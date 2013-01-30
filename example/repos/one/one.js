/*
 *  one.js - a nodejs http server
 *
 */

var http = require('http')
var server = http.createServer(function(req, res) {
  console.log(req.headers.host)
  res.end(process.env.MESSAGE)
})
server.listen(process.env.PORT)
console.log(process.env.NAME + '@' + process.env.VERSION + ' listening on ' + process.env.PORT)