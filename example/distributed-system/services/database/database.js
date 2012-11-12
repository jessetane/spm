/*
 *  database.js
 *
 */

var env = process.env;
var http = require("http");

var server = http.createServer(function (req, res) {
  res.end(env.DATABASE_DATA);
});

server.listen(env.DATABASE_PORT);
console.log("Database listening on " + env.WEBSITE_PORT);
