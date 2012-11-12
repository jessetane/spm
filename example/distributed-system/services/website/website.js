/*
 *  website.js
 *
 */

var env = process.env;
var http = require("http");

var server = http.createServer(function (req, res) {
  http.request({
    host: env.DATABASE_HOST,
    port: env.DATABASE_PORT,
    method: "GET"
  }, function (dbres) {
    var data = "";
    dbres.on("data", function (d) { data += d });
    dbres.on("end", function () {
      res.end("WEB - DB SAYS: " + data);
    });
  }).end();
});

server.listen(env.WEBSITE_PORT);
console.log("Website listening on " + env.WEBSITE_PORT);
