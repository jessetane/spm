/*
 *  views.js
 *
 */


var cui = require("cui");
var util = require("./util");
var exec = require("child_process").exec;
var config = require("./config");
var actions = require("./actions");


var environments = {
  title: "environments",
  type: "buttons",
  data: function (cb) {
    cb(null, config.environments);
  }
};

var services = {
  title: "Services:",
  type: "buttons",
  data: function (cb) {
    var env = cui.results[0];
    var envServices = {};
    for (var h in env.hosts) {
      var host = env.hosts[h];
      util._extend(envServices, host.services);
    }
    cb(null, envServices);
  }
};

var versions = {
  title: "Versions:",
  type: "buttons",
  data: function (cb) {
    var source = cui.last(1).source;
    exec("cd " + source + "; git tag", function (err, data) {
      var versions = data.split("\n").slice(0, -1);
      cb(null, [ "HEAD" ].concat(versions.reverse()));
    });
  }
};

var servicesLive = {
  title: function (cb) {
    cb(null, "Services currently deployed to '" + cui.last(1).name + "':");
  },
  type: "buttons",
  data: function (cb) {
    var environment = cui.last(1);
    util.listDirForEnvironment("", environment, null, function (err, data) {
      if (!err && data.length === 0) {
        err = new Error("No services found on '" + cui.last(1).name + "'");
      }
      cb(err, data && data.map(function (service) {
        return environment.services[service];
      }).sort(function (a, b) {
        return a.name > b.name;
      }));
    });
  }
};

var versionsLive = {
  title: function (cb) {
    cb(null, "Versions of '" + cui.last(1).name + "' currently deployed to '" + cui.last(2).name + "':");
  },
  type: "buttons",
  data: function (cb) {
    var environment = cui.last(2);
    var service = cui.last(1);
    util.listDirForEnvironment(service.name + "/versions", environment, service, cb);
  }
};

var hosts = {
  title: "Hosts",
  type: "buttons",
  data: function (cb) {
    var env = cui.last(1);
    cb(null, env.hosts);
  }
};

var scripts = {
  title: function (cb) {
    cb(null, "Commands currently available for '" + cui.last(2).name + "@" + cui.last(1) + "' in '" + cui.last(3).name + "':");
  },
  type: "buttons",
  data: function (cb) {
     var environment = cui.last(3);
     var service = cui.last(2);
     var version = cui.last(1);
     var scriptsDir = service.scripts;
     util.listDirForEnvironment(service.name + "/versions/" + version + "/" + scriptsDir, environment, service, cb);
  }
};

var scriptArgs = {
  type: "fields",
  data: function (cb) {
    var script = cui.last(1);
    cb(null, "Arguments for '" + script + "': ");
  }
};

var confirm = {
  type: "fields",
  data: "Are you sure? [n/y]: "
};

var status = {
  title: function (cb) { cb(null, cui.results[0].name) },
  type: "buttons",
  categories: [ "host" ],
  properties: [ "name", "status" ],
  data: function (cb) {
    actions.status(cui.results[0], cb);
  }
}


// exports
exports.environments = environments;
exports.services = services;
exports.versions = versions;
exports.servicesLive = servicesLive;
exports.versionsLive = versionsLive;
exports.scripts = scripts;
exports.scriptArgs = scriptArgs;
exports.confirm = confirm;
exports.hosts = hosts;
exports.status = status;
