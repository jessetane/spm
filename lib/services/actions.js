/*
 *  actions.js
 *
 */


var cp = require("child_process");
var exec = cp.exec;
var spawn = cp.spawn;
var cui = require("cui");
var util = require("../util");


exports.status = function (environment, cb) {
  var services = []
  util.forEachHost(environment, null, function (host, cb) {
    var cmd = "ssh -o StrictHostKeychecking=no -i " + host.key + " " + host.user + "@" + host.name + " '\
    for SERVICE in $(find " + host.root + "/*/versions -mindepth 1 -maxdepth 1); do\
      VERSION=$(basename $SERVICE);\
      SERVICE_PATH=$(dirname $(dirname $SERVICE));\
      SERVICE_NAME=$(basename $SERVICE_PATH);\
      echo \"" + host.name + "\n$SERVICE_NAME@$VERSION\n$($SERVICE/bin/status)\n\";\
    done;\
    '";
    exec(cmd, function (err, data) {
      cb(err, data.slice(0,-2));
    });
  }, function (err, data) {
    if (err) {
      console.log(host.name + " failed to list processes - " + (data.stderr || err));
    } else {
      if (data.stdout) {
        data.stdout.split("\n\n").forEach(function (status) {
          status = status.split("\n")
          services.push({
            host: status[0],
            name: status[1],
            status: status[2]
          })
        })
      }
    }
  }, function () {
    cb(null, services);
  });
}


exports.statuss = function (environment, cb) {
  var envServices = {};
  util.forEachHost(environment, null, function (host, cb) {
    var services = environment.services;
    for (var s in services) {
      var service = util._extend({}, services[s]);
      service.host = host.name;
      service.status = "not installed";
      envServices[host.name + service.name] = service;
    }
    var cmd = "ssh -o StrictHostKeychecking=no -i " + host.key + " " + host.user + "@" + host.name + " '\
    for SERVICE in $(find " + host.root + "/*/versions -mindepth 1 -maxdepth 1); do\
      VERSION=$(basename $SERVICE);\
      SERVICE_PATH=$(dirname $(dirname $SERVICE));\
      SERVICE_NAME=$(basename $SERVICE_PATH);\
      echo \"" + host.name + "\n$SERVICE_NAME@$VERSION\n$($SERVICE/bin/status)\n\";\
    done;\
    '";
    exec(cmd, function (err, data) {
      cb(err, data.slice(0,-2));
    });
  }, function (err, data) {
    if (err) {
      console.log(host.name + " failed to list processes - " + (data.stderr || err));
    } else {
      if (data.stdout) {
        data.stdout.split("\n\n").forEach(function (status) {
          status = status.split("\n");
          var hname = status[0];
          var snameversion = status[1];
          var status = status[2];
          var sname = snameversion.split("@")[0];
          delete envServices[hname + sname];
          var service = util._extend({}, environment.services[sname]);
          service.name = snameversion;
          service.host = hname;
          service.status = status;
          envServices[hname + snameversion] = service;
        });
      }
    }
  }, function () {
    var temp = [];
    for (var s in envServices) temp.push(envServices[s]);
    cb(null, temp);
  });
}
