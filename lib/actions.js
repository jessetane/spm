/*
 *  actions.js
 *
 */


var cp = require("child_process");
var exec = cp.exec;
var spawn = cp.spawn;
var cui = require("cui");
var util = require("./util");


exports.deploy = deploy;
exports.withdraw = withdraw;
exports.command = command;
exports.logon = logon;
exports.status = status;


function deploy (service, version, environment) {
  version = version.split(" ")[0];
  console.log("Deploying " + service.name + "@" + version + " to '" + environment.name + "'...");
  var sshkeys = [];
  var responses = [];
  util.forEachHost(environment, service, function (host, credential, cb) {
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

function withdraw (environment, service, version, cb) {
  console.log("Withdrawing " + service.name + "@" + version + " from '" + environment.name + "'...");
  util.forEachHost(environment, service, function (host, credential, cb) {
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

function command (environment, service, version, script, args, cb) {
  script = (args) ? script + " " + args : script;
  var scriptsDir = service.scripts;
  console.log("Running " + service.name + "@" + version + "/" + scriptsDir + "/" + script + " in '" + environment.name + "'...");
  util.forEachHost(environment, service, function (host, credential, cb) {
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

function logon (host, cb) {
  var credential = host.credential;
  util.expandPath(credential.key, function (err, key) {
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
      var hosts = updateVhosts(data.split("\n"), envHosts);
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
        var hosts = updateVhosts(data.slice(0,-1).split("\n"), host.vhosts);
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

function status (environment, cb) {
  var envServices = {};
  util.forEachHost(environment, null, function (host, credential, cb) {
    for (var s in host.services) {
      var service = util._extend({}, host.services[s]);
      service.host = host.name;
      service.status = "not installed";
      envServices[host.name + service.name] = service;
    }
    var cmd = "ssh -o StrictHostKeychecking=no -i " + credential.key + " " + credential.user + "@" + host.name + " '\
    for SERVICE in $(find " + host.directory + "/*/versions -mindepth 1 -maxdepth 1); do\
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
          var service = util._extend({}, environment.hosts[hname].services[sname]);
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
