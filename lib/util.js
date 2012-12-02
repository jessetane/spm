/*
 *  helpers.js
 *
 */


var util = require("util");
util._extend(exports, util);

var exec = require("child_process").exec;


exports.inflate = inflate;
exports.expandPath = expandPath;
exports.serviceVars = serviceVars;
exports.forEachHost = forEachHost;
exports.listDirForEnvironment = listDirForEnvironment;
exports.listDirForHost = listDirForHost;
exports.updateVhosts = updateVhosts;


function inflate (config) {
  var hosts = config.hosts
  var services = config.services
  var environments = config.environments = {}
  
  // hosts & environments
  for (var h in hosts) {
    var host = hosts[h]
    host.name = h
    host.address = host.address || (host.name === "localhost" && "127.0.0.1" || host.name)
    if (!environments[host.environment]) {
      environments[host.environment] = {}
      environments[host.environment].name = host.environment
      environments[host.environment].hosts = {}
      environments[host.environment].services = services
    }
    environments[host.environment].hosts[host.name] = host
  }
  
  // services
  for (var s in services) {
    var service = services[s]
    if (typeof service === "string") {
      service = services[s] = { source: service }
    }
    service.name = s
    service.scripts = service.scripts || "bin"
  }
  
  return config
}

function expandPath (path, cb) {
  exec("echo " + path, cb);
}

function serviceVars (service) {
  var vars = service.variables;
  return Object.keys(vars).map(function (key) {
    return key + "=\"" + vars[key] + "\"";
  }).join(" ");
}

function forEachHost (environment, service, operation, cb, alldone) {
  var ops = {};
  var done = 0;
  var hosts = environment.hosts;
  var hnames = Object.keys(hosts);
  hnames.forEach(function (hname) {
    var host = hosts[hname];
    if (isServiceHost(host)) {
      operation(host, function (err, stdout, stderr) {
        if (stderr && stderr.slice(-1) === "\n") {
          stderr = stderr.slice(0, -1);
        }
        cb(err, {
          host: host,
          stdout: stdout,
          stderr: stderr
        });
        checkDone();
      });
    } else {
      checkDone();
    }
  });
  
  function isServiceHost (host) {
    var isHost = true;
    if (service) {
      isHost = false;
      for (var s in host.services) {
        if (host.services[s].name === service.name) {
          isHost = true;
          break;
        }
      }
    }
    return isHost;
  }
  
  function checkDone () {
    if (++done == hnames.length && alldone) {
      alldone();
    }
  }
}

function listDirForEnvironment (dir, environment, service, cb) {
  var responses = [];
  var errors = [];
  forEachHost(environment, service, function (host, cb) {
    listDirForHost(host.root + "/" + dir, host, cb);
  }, function (err, response) {
    if (err) {
      errors.push(err);
    } else {
      responses = responses.concat(response.stdout);
    }
  }, function () {
    if (errors.length) {
      cb(errors[0]);
    } else {
      var lookup = {};
      for (var r in responses) lookup[responses[r]] = null;
      var keys = Object.keys(lookup);
      cb(null, keys);
    }
  });
}

function listDirForHost (dir, host, cb) {
  var cmd = "ssh -o StrictHostKeychecking=no -i " + host.key + " " + host.user + "@" + host.name + " '\
  ls -1t " + dir + ";\
  '";
  exec(cmd, function (err, data) {
    if (!err) {
      data = data.split("\n").slice(0, -1);
    }
    cb(err, data);
  });
}

function updateVhosts (oldhosts, newhosts) {
  var hosts = [];
  for (var i in oldhosts) {
    var oldhost = oldhosts[i];
    var add = true;
    for (var host in newhosts) {
      var address = newhosts[host];
      if (oldhost.match(new RegExp("\\s+" + host + "$"))) {
        if (oldhost.match(new RegExp("^" + address + "\\s"))) {
          delete newhosts[host];
          break;
        } else {
          add = false;
        }
      }
    }
    if (add) {
      hosts.push(oldhost);
    }
  }
  for (var host in newhosts) {
    var address = newhosts[host];
    hosts.push(address + " " + host);
  }
  return hosts.join("\n") + "\n";
}
