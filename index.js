#!/usr/bin/env node

/*
 *  deployer.js
 *
 */


var fs = require("fs");
var util = require("util");
var child_process = require("child_process");
var exec = child_process.exec;
var spawn = child_process.spawn;
var cui = require("cui");
var config = inflateConfig(require(process.cwd() + "/deploy.json"));
var connections = {};

// debug
fs.writeFileSync("testing", JSON.stringify(config, true, 2));

//  views

cui.push({
  title: "Welcome",
  type: "buttons",
  data: [
    "Deploy",
    "Withdraw",
    "Configure",
    "Ps",
    "Command",
    "Logon"
  ],
  action: function (cb) {
    var choice = cui.results.slice(-1)[0];
    if (choice) {
      switch (choice.toLowerCase()) {
        case "deploy":
          cui.push(environments);
          cui.push(services);
          cui.push(versions);
          cui.push(function (cb) {
            var environment = cui.last(3);
            var service = cui.last(2);
            var version = cui.last(1);
            deploy(service, version, environment);
            cb();
          });
          break;
        case "withdraw":
          cui.push(environments);
          cui.push(servicesLive);
          cui.push(versionsLive);
          cui.push(confirm);
          cui.push(function (cb) {
            var environment = cui.last(4);
            var service = cui.last(3);
            var version = cui.last(2);
            if (cui.last(1) && cui.last(1).toLowerCase().search("y") === 0) {
              withdraw(environment, service, version, cb);
            } else {
              console.log("Withdrawal aborted");
            }
          });
          break;
        case "configure":
          cui.push(environments);
          cui.push(function (cb) {
            configure(cui.last(1), cb);
          });
          break;
        case "ps":
          cui.push(environments);
          cui.push(function (cb) {
            ps(cui.last(1), cb);
          });
          break;
        case "command":
          cui.push(environments);
          cui.push(servicesLive);
          cui.push(versionsLive);
          cui.push(scripts);
          cui.push(function (cb) {
            var environment = cui.last(4);
            var service = cui.last(3);
            var version = cui.last(2);
            var script = cui.last(1);
            command(environment, service, version, script, "", cb);
          });
          break;
        case "logon":
          cui.push(environments);
          cui.push(hosts);
          cui.push(function (cb) {
            var host = cui.last(1);
            logon(host, cb);
          });
          break;
      }
      cb();
    }
  }
});

var services = {
  title: "Services:",
  type: "buttons",
  data: function (cb) {
    var env = util._extend({}, cui.last(1));
    //env.services["all"] = -1;
    cb(null, env.services);
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
    listDirForEnvironment("", environment, null, function (err, data) {
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
    listDirForEnvironment(service.name + "/versions", environment, service, cb);
  }
};

var environments = {
  title: "Environments",
  type: "buttons",
  data: function (cb) {
    cb(null, config.environments);
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
     listDirForEnvironment(service.name + "/versions/" + version + "/" + scriptsDir, environment, service, cb);
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


//  actions

function logon (host, cb) {
  var credential = host.credential;
  expandPath(credential.key, function (err, key) {
    var cmd = "ssh";
    var args = [
      "-o",
      "StrictHostKeychecking=no",
      "-i",
      key.split("\n")[0],
      credential.user + "@" + host.name
    ];
    spawn(cmd, args, { stdio: "inherit" });
    cb();
  });
}

function command (environment, service, version, script, args, cb) {
  script = (args) ? script + " " + args : script;
  var scriptsDir = service.scripts;
  console.log("Running " + service.name + "@" + version + "/" + scriptsDir + "/" + script + " in '" + environment.name + "'...");
  forEachHost(environment, service, function (host, credential, cb) {
    var home = host.directory + "/" + service.name + "/versions/" + version;
    var vars = "HOST=" + service.name + "@" + version + " " + serviceVars(service);
    var cmd = "ssh -o StrictHostKeychecking=no -i " + credential.key + " " + credential.user + "@" + host.name + " '\
    cd " + home + ";\
    " + vars + " " + home + "/" + scriptsDir + "/" + script + " " + args + "\
    '";
    exec(cmd, cb);
  }, function (err, data) {
    if (err) {
      console.log(service.name + "@" + version + "/" + scriptsDir + "/" + script + " failed on " + data.host.name + " - " + (data.stderr || err));
    } else {
      console.log(service.name + "@" + version + "/" + scriptsDir + "/" + script + " ran successfully on " + data.host.name);
    }
  }, cb);
}

function configure (environment, cb) {
  fs.readFile("/etc/hosts", "utf8", function (err, data) {
    if (err) {
      cb(err);
    } else {
      var envHosts = {};
      for (var host in environment.hosts) {
        host = environment.hosts[host];
        envHosts[host.name] = host.address;
      }
      var hosts = updateEtcHosts(data.split("\n"), envHosts);
      fs.writeFile("/etc/hosts", hosts, function (err, data) {
        if (err) {
          cb(err);
        } else {
          console.log("Configured your local machine successfully");
          configureRemotes(environment, cb);
        }
      });
    }
  });
}

function configureRemotes (environment, cb) {
  forEachHost(environment, null, function (host, credential, cb) {
    var cmd = "ssh -o StrictHostKeychecking=no -i " + credential.key + " " + credential.user + "@" + host.name + " '\
    cat /etc/hosts;\
    '";
    exec(cmd, function (err, data) {
      if (err) {
        cb(err);
      } else {
        var hosts = updateEtcHosts(data.slice(0,-1).split("\n"), host.hostsByService);
        var cmd = "ssh -o StrictHostKeychecking=no -i " + credential.key + " " + credential.user + "@" + host.name + " '\
        echo \"" + hosts + "\" > /etc/hosts;\
        '";
        exec(cmd, cb);
      }
    });
  }, function (err, data) {
    if (err) {
      console.log("Failed to configure " + data.host.name + " " + (data.stderr || err));
    } else {
      console.log("Configured " + data.host.name + " successfully");
    }
  }, cb);
}

function ps (environment, cb) {
  forEachHost(environment, null, function (host, credential, cb) {
    var cmd = "ssh -o StrictHostKeychecking=no -i " + credential.key + " " + credential.user + "@" + host.name + " '\
    echo \"" + host.name + ":\";\
    for SERVICE in $(find " + host.directory + "/*/versions -mindepth 1 -maxdepth 1); do\
      VERSION=$(basename $SERVICE);\
      echo \"$(basename $(dirname $(dirname $SERVICE)))@$VERSION : $($SERVICE/bin/status)\";\
    done;\
    '";
    exec(cmd, function (err, data) {
      cb(err, data);
    });
  }, function (err, data) {
    if (err) {
      console.log(host.name + " failed to list processes - " + (data.stderr || err));
    } else {
      data = data.stdout.slice(0,-1).split("\n");
      console.log("• " + data[0]);
      var statuses = data.slice(1);
      for (var s in statuses) {
        if (s == statuses.length-1) {
          console.log("└─ " + statuses[s]);
        } else {
          console.log("├─ " + statuses[s]);
        }
      }
    }
  }, cb);
}

function withdraw (environment, service, version, cb) {
  console.log("Withdrawing " + service.name + "@" + version + " from '" + environment.name + "'...");
  forEachHost(environment, service, function (host, credential, cb) {
    var versionDir = host.directory + "/" + service.name + "/versions/" + version;
    var serviceDir = host.directory + "/" + service.name;
    var cmd = "ssh -o StrictHostKeychecking=no -i " + credential.key + " " + credential.user + "@" + host.name + " '\
    rm -rf " + versionDir + ";\
    [ $(ls " + serviceDir + "/versions | wc -l) = 0 ] && rm -rf " + serviceDir + ";\
    '";
    exec(cmd, function (err, data) {
      cb(err, data);
    });
  }, function (err, data) {
    if (err) {
      console.log(service.name + "@" + version + " failed to withdraw from " + data.host.name + " - " + (data.stderr || err));
    } else {
      console.log(service.name + "@" + version + " withdrawn successfully from " + data.host.name);
    }
  }, cb);
}

function deploy (service, version, environment) {
  version = version.split(" ")[0];
  console.log("Deploying " + service.name + "@" + version + " to '" + environment.name + "'...");
  var sshkeys = [];
  var responses = [];
  forEachHost(environment, service, function (host, credential, cb) {
    sshkeys.push(credential.key);
    deployPrepare(service, version, host, credential, cb);
  }, function (err, data) {
    if (err) {
      responses.push(service.name + "@" + version + " failed to deploy to " + data.host.name + " - " + (data.stderr || err));
    } else {
      responses.push(service.name + "@" + version + " deployed successfully to " + data.host.name);
    }
  }, function () {
    for (var r in responses) console.log(responses[r]);
    for (var key in sshkeys) exec("ssh-add -d " + sshkeys[key]);
  });
}

function deployPrepare (service, version, host, credential, cb) {
  var confirmOverwriteView = {
    type: "fields",
    data: service.name + "@" + version + " already exists on " + host.name + ", do you want to overwrite? [y/n]: ",
    action: function (ccb) {
      var answer = cui.last(1);
      if (answer && answer.search("y") === 0) {
        deployUpdate(service, version, host, credential, cb);
      } else {
        cb(new Error("Deploy aborted"));
      }
      ccb();
    }
  };
  var home = host.directory + "/" + service.name;
  var cmd = "ssh -o StrictHostKeychecking=no -i " + credential.key + " " + credential.user + "@" + host.name + " '\
  mkdir -p "+ home + "/versions;\
  if [ ! -e " + home + "/repo ];\
  then\
    mkdir " + home + "/repo;\
    cd " + home + "/repo;\
    git init --bare;\
  fi;\
  if [ -e " + home + "/versions/" + version + " ]; then echo 1; else echo 0; fi\
  '";
  exec(cmd, function (err, stdout) {
    if (err) {
      cb(err);
    } else {
      var exists = stdout.split("\n").slice(-2)[0];
      if (exists === "1") {
        cui.push(confirmOverwriteView);
      } else {
        //console.log("DEPLOY PREPARE", arguments); // debug
        deployUpdate(service, version, host, credential, cb);
      }
    }
  });
}

function deployUpdate (service, version, host, credential, cb) {
  var cmd = "cd " + process.cwd() + "/" + service.source + ";\
  ssh-add " + credential.key + ";\
  git push " + credential.user + "@" + host.name + ":" + host.directory + "/" + service.name +"/repo --all;\
  git push " + credential.user + "@" + host.name + ":" + host.directory + "/" + service.name +"/repo --tags;\
  ";
  exec(cmd, function (err) {
    if (err) {
      cb(err);
    } else {
      //console.log("DEPLOY UPDATE", arguments); // debug
      deployInstall(service, version, host, credential, cb);
    }
  });
}

function deployInstall (service, version, host, credential, cb) {
  var home = host.directory + "/" + service.name;
  cmd = "ssh -o StrictHostKeychecking=no -i " + credential.key + " " + credential.user + "@" + host.name + " '\
  cd " + home + "/versions;\
  [ ! -e " + version + " ] && git clone ../repo " + version + ";\
  cd " + version + ";\
  git fetch --all;\
  git fetch --tags;\
  git checkout " + version + ";\
  git pull --rebase origin " + version + ";\
  '";
  exec(cmd, function () {
    //console.log("DEPLOY INSTALL", arguments); // debug
    cb.apply(null, arguments);
  });
}


//  helpers

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
    env.services = {};
    
    // hosts
    var hosts = env.hosts;
    var hostsByService = {};
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
        
        // add the service to the env hostsByService lookup table
        hostsByService[sname] = host.address;
        env.services[sname] = service;
        
        // store updated service
        host.services[sname] = service;
      });
    });
    
    // ensure each host has a locally prioritized hostsByService lookup table
    Object.keys(hosts).forEach(function (hname) {
      var host = hosts[hname];
      var temp = util._extend({}, hostsByService);
      var services = Object.keys(host.services);
      services.forEach(function (sname) {
        temp[sname] = host.address;
      });
      hosts[hname].hostsByService = temp;
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

function updateEtcHosts (oldhosts, newhosts) {
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
