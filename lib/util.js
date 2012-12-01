/*
 *  helpers.js
 *
 */


var exec = require("child_process").exec;
var util = require("util");
util._extend(exports, util);


exports.inflateConfig = inflateConfig;
exports.expandPath = expandPath;
exports.serviceVars = serviceVars;
exports.forEachHost = forEachHost;
exports.listDirForEnvironment = listDirForEnvironment;
exports.listDirForHost = listDirForHost;
exports.updateVhosts = updateVhosts;


function inflateConfig (config) {
  // credentials - just add name
  var credentials = config.credentials;
  Object.keys(credentials).forEach(function (cname) {
    credentials[cname].name = cname;
  });
  
  // environments
  var environments = config.environments;
  Object.keys(environments).forEach(function (ename) {
    var env = environments[ename];
    env.name = ename;
    
    // hosts
    var hosts = env.hosts;
    var vhosts = {};
    Object.keys(hosts).forEach(function (hname) {
      var host = hosts[hname];
      host.name = hname;
      host.address = host.address || (host.name === "localhost" && "127.0.0.1" || host.name);
      
      // lookup credential pointer
      host.credential = credentials[host.credential];
      
      // compound host specific environment variables
      var special = host.variables;
      host.variables = util._extend({}, env.variables);
      util._extend(host.variables, special);
      
      // services
      var services = Object.keys(host.services);
      services.forEach(function (sname) {
        
        // get service data
        var service = host.services[sname];
        if (typeof service === "string") {
          service = { source: service };
        }
        
        // get the host name for the service
        service.name = sname;
        service.scripts = service.scripts || "bin";
        
        // compound service specific environment variables
        var special = service.variables;
        service.variables = util._extend({}, host.variables);
        util._extend(service.variables, special);
        
        // add the service to the vhosts lookup table
        vhosts[sname] = host.address;
        
        // store updated service
        host.services[sname] = service;
      });
    });
    
    // ensure each host has a locally prioritized vhosts lookup table
    Object.keys(hosts).forEach(function (hname) {
      var host = hosts[hname];
      var temp = util._extend({}, vhosts);
      var services = Object.keys(host.services);
      services.forEach(function (sname) {
        temp[sname] = host.address;
      });
      hosts[hname].vhosts = temp;
    });
  });
  return config;
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
      operation(host, host.credential, function (err, stdout, stderr) {
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
  forEachHost(environment, service, function (host, credential, cb) {
    listDirForHost(host.directory + "/" + dir, host, credential, cb);
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

function listDirForHost (dir, host, credential, cb) {
  var cmd = "ssh -o StrictHostKeychecking=no -i " + credential.key + " " + credential.user + "@" + host.name + " '\
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
