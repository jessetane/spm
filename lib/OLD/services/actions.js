/*
 *  actions.js
 *
 */


var cp = require("child_process")
var exec = cp.exec
var spawn = cp.spawn
var util = require("../util")
var url = require("url")


exports.status = function (environment, cb) {
  var services = []
  util.forEachHost(environment, null, function (host, cb) {
    var cmd = "ssh -o StrictHostKeychecking=no -i " + host.key + " " + host.user + "@" + host.address + " '\
    for SERVICE in $(find " + host.root + "/*/versions -mindepth 1 -maxdepth 1); do\
      VERSION=$(basename $SERVICE);\
      SERVICE_PATH=$(dirname $(dirname $SERVICE));\
      SERVICE_NAME=$(basename $SERVICE_PATH);\
      echo \"" + host.name + "\n$SERVICE_NAME@$VERSION\n$($SERVICE/bin/status)\n\";\
    done;\
    '"
    exec(cmd, function (err, data) {
      cb(err, data.slice(0,-2))
    })
  }, function (err, data) {
    if (err) {
      console.log("failed to list processes - " + (data.stderr || err))
    } else {
      if (data.stdout) {
        data.stdout.split("\n\n").forEach(function (status) {
          status = status.split("\n")
          var host = status[0]
          var service = status[1]
          var status = status[2]
          var parts = service.split("@")
          var name = parts[0]
          var version = parts[1]
          var temp = util._extend({}, environment.services[name])
          temp.host = util._extend({}, environment.hosts[host])
          temp.hostname = temp.host.name
          temp.servicename = service
          temp.version = version
          temp.status = status
          services.push(temp)
        })
      }
    }
  }, function () {
    services = services.sort(function (a, b) {
      return a.hostname > b.hostname
    })
    cb(null, services)
  })
}

exports.versions = function (service, cb) {
  var source = service.source
  var u = url.parse(service.source)
  if (u.protocol) {
    console.log("TODO remote repo", source)
  } else {
    var cmd = "cd " + source + "; git tag"
    exec(cmd, function (err, data) {
      var versions = data.split("\n").slice(0, -1)
      cb(null, [ "HEAD" ].concat(versions.reverse()))
    })
  }
}

exports.connect = function (env, service, cb) {
  var host = service.host
  util.expandPath(host.key, function (err, key) {
    var cmd = "ssh"
    var args = [
      "-t",
      "-o",
      "StrictHostKeychecking=no",
      "-i",
      key.split("\n")[0],
      host.user + "@" + host.address,
      "cd " + host.root + "/" + service.name + "/versions/" + service.version + "; bash",
    ]
    spawn(cmd, args, { stdio: "inherit" })
    cb()
  })
}

exports.command = function (environment, service, command, cb) {
  var host = service.host
  var home = host.root + "/" + service.name + "/versions/" + service.version
  var vars = "HOST=" + service.name + "@" + service.version + " " + util.serviceVars(service)
  var cmd = "ssh -o StrictHostKeychecking=no -i " + host.key + " " + host.user + "@" + host.address + " '\
  cd " + host.root + "/" + service.name + "/versions/" + service.version + ";\
  " + vars + " " + command + ";\
  '"
  exec(cmd, function (err, stdout, stderr) {
    if (!err) {
      if (stdout.slice(-1) === "\n") stdout = stdout.slice(0, -1)
      if (stderr.slice(-1) === "\n") stderr = stderr.slice(0, -1)
      console.log(stdout || stderr)
    }
    cb(err)
  })
}

exports.withdraw = function (environment, service, cb) {
  var host = service.host
  var version = service.version
  var versionDir = host.root + "/" + service.name + "/versions/" + version
  var serviceDir = host.root + "/" + service.name
  var cmd = "ssh -o StrictHostKeychecking=no -i " + host.key + " " + host.user + "@" + host.address + " '\
  rm -rf " + versionDir + ";\
  [ $(ls " + serviceDir + "/versions | wc -l) = 0 ] && rm -rf " + serviceDir + ";\
  '";
  exec(cmd, function (err, stdout, stderr) {
    if (err) {
      console.log("WTF?", err, stdout, stderr, "WTF!\n");
      console.log("failed to withdraw " + service.name + "@" + version + " from " + host.name + " - " + (stderr || err))
    } else {
      console.log(service.name + "@" + version + " withdrawn successfully from " + host.name)
    }
    cb(err)
  })
}

exports.updateVhosts = function (environment, host, service, cb) {
  var vhosts = {}
  vhosts[service.name] = host.address
  util.forEachHost(environment, null, function (host, cb) {
    var cmd = "ssh -o StrictHostKeychecking=no -i " + host.key + " " + host.user + "@" + host.address + " '\
    cat /etc/hosts;\
    '";
    exec(cmd, function (err, data) {
      if (err) {
        cb(err);
      } else {
        var hosts = util.updateVhosts(data.slice(0,-1).split("\n"), vhosts);
        var cmd = "ssh -o StrictHostKeychecking=no -i " + host.key + " " + host.user + "@" + host.address + " '\
        echo \"" + hosts + "\" > /etc/hosts;\
        '";
        exec(cmd, cb);
      }
    });
  }, function (err, data) {
    if (err) {
      console.log("failed to update /etc/hosts on " + data.host.name + " " + (data.stderr || err));
    } else {
      console.log("updated /etc/hosts on " + data.host.name + " successfully");
    }
  }, cb);
}

exports.prepareDeploy = function (host, service, version, cb) {
  var home = host.root + "/" + service.name
  var cmd = "ssh -o StrictHostKeychecking=no -i " + host.key + " " + host.user + "@" + host.address + " '\
  mkdir -p "+ home + "/versions;\
  if [ ! -e " + home + "/repo ];\
  then\
    mkdir " + home + "/repo;\
    cd " + home + "/repo;\
    git init --bare;\
  fi;\
  if [ -e " + home + "/versions/" + version + " ]; then echo 1; else echo 0; fi\
  '"
  
  autoexec("../", {
    HOME: home
    VERSION: version
  }, function (err, stdout, stderr) {
    
  })
  exec(cmd, { env:  }, function (err, stdout, stderr) {
    if (!err) {
      stdout = stdout.split("\n").slice(-2)[0]
    }
    cb(err, stdout)
  })
}

exports.deploy = function (host, service, version, cb) {
  console.log("deploying " + service.name + "@" + version + " to " + host.name + "...")
  var sshkey = host.key
  deployUpdate(host, service, version, function (err, stdout, stderr) {
    if (err) {
      console.log(service.name + "@" + version + " failed to deploy to " + host.name + " - " + (stderr || err))
    } else {
      console.log(service.name + "@" + version + " deployed successfully to " + host.name)
    }
    exec("ssh-add -d " + sshkey)
    cb(err)
  })
}

function deployUpdate (host, service, version, cb) {
  var cmd = "cd " + process.cwd() + "/" + service.source + ";\
  ssh-add " + host.key + ";\
  git push -f " + host.user + "@" + host.address + ":" + host.root + "/" + service.name +"/repo --all;\
  git push -f " + host.user + "@" + host.address + ":" + host.root + "/" + service.name +"/repo --tags;\
  "
  // TODO - this is a bit hack since even a successful 'git push -f' will exit non-zero
  exec(cmd, function (err, stdout, stderr) {
    if (err) {
      cb(err)
    } else {
      //console.log("DEPLOY UPDATE", arguments) // debug
      deployInstall(host, service, version, cb)
    }
  })
}

function deployInstall (host, service, version, cb) {
  var home = host.root + "/" + service.name
  cmd = "ssh -o StrictHostKeychecking=no -i " + host.key + " " + host.user + "@" + host.address + " '\
  cd " + home + "/versions;\
  [ ! -e " + version + " ] && git clone ../repo " + version + ";\
  cd " + version + ";\
  git fetch --all;\
  git fetch --tags;\
  git reset --hard " + version + ";\
  '"
  exec(cmd, function () {
    //console.log("DEPLOY INSTALL", arguments) // debug
    cb.apply(null, arguments)
  })
}
