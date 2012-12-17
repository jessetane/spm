#!/usr/bin/env node

/*
 *  deployer.js
 *
 */


var fs = require("fs")
var cui = require("cui")
var util = require("./lib/util")

var exec = require("child_process").exec
var request = require("request")
var async = require("async")
var url = require("url")
var path = require("path")

var config = null


//
//  flow
//

// repos
// versions
// environments (if there are more than one)
// machines (if there are more than one)
// domains (comma seperated)
// aliases (comma seperated)
// move the code
// run hooks

cui.push({
  title: "pick a repository to deploy",
  type: "buttons",
  data: function (cb) {
    exec("echo ~", function (err, path) {
      config = loadConfig()
      listPackages(config.repos, cb)
    })
  }
})

cui.push({
  title: "versions",
  type: "buttons",
  data: function (cb) {
    var service = cui.last(2)
    getVersions(cui.last(2), cb)
  }
})

cui.push(function (cb) {
  var err, environments = config.environments
  var keys = (environments) ? Object.keys(environments) : null
  if (environments && keys && keys.length) {
    if (keys.length === 1) {
      cui.results.push(environments[keys[0]])
    } else {
      var v = new EnvironmentsView(environments)
      cui.splice(v)
    }
  } else {
    err = new Error("no environments found")
  }
  cb(err)
})

cui.push(function (cb) {
  var err, machines
  if (cui.results.length === 3) {
    machines = cui.last(1).machines
  } else {
    machines = config.machines
  }
  var keys = (machines) ? Object.keys(machines) : null
  if (machines && keys && keys.length) {
    if (keys.length === 1) {
      cui.results.push(machines[keys[0]])
    } else {
      cui.splice(new MachinesView(machines))
    }
  } else {
    err = new Error("no machines found")
  }
  cb(err)
})

cui.push({
  type: "fields",
  data: "service domain: "
})

cui.push({
  type: "fields",
  data: "service aliases: "
})

cui.push(function (cb) {
  var repo = cui.last(6)
  var version = cui.last(5)
  var machine = cui.last(3)
  var domain = cui.last(2)
  console.log("\nexists?:")
  console.log(repo)
  console.log(version)
  console.log(machine)
  console.log(domain, "\n")
  cb()
})

cui.push(function (cb) {
  var environment = cui.last(4)
  var machine = cui.last(3)
  var domain = cui.last(2)
  var aliases = cui.last(1)
  console.log("update dns:")
  console.log(environment)
  console.log(machine)
  console.log(domain)
  console.log(aliases, "\n")
  cb()
})

cui.push(function (cb) {
  var repo = cui.last(6)
  var version = cui.last(5)
  var machine = cui.last(3)
  var domain = cui.last(2)
  console.log("move code:")
  console.log(repo)
  console.log(version)
  console.log(machine)
  console.log(domain, "\n")
  cb()
})


//
//  views
//



/*

global install
REPO
SERVICE
CONFIG
BIN

/usr/local/lib/reponame
/usr/local/src/service@version
/usr/local/etc/service@version/environment
/usr/local/etc/service@version/aliases
/usr/local/bin/service@version init-script



SERVICE/bin/install
/etc/init/service@version -> /usr/local/bin/service@version

*/


//
//  service start
//  register with rproxy
//  get port
//  register aliases with rproxy
//  get env
//  run
//


function EnvironmentsView (environments) {
  this.title = "environments"
  this.type = "buttons"
  this.data = environments
}

function MachinesView (machines) {
  this.title = "machines"
  this.type = "buttons"
  this.data = machines
}

function ConfirmationView (service, version, machine) {
  this.type = "fields",
  this.data = service + "@" + version + " already exists on " + machine.name + ", do you want to overwrite? [Y/n]: "
}


//
//  actions
//

function loadConfig () {
  //config = require(path.slice(0,-1) + "/.deploy")
  return require("./example/deploy")
}

function listRepos (repos, cb) {
  var ops = []
  Object.keys(repos).forEach(function (reponame) {
    var repourl = url.parse(repos[reponame])
    var protocol = (repourl.protocol) ? repourl.protocol.slice(0,-1) : "git"
    var fetcher = fetchers[protocol]
    if (fetcher) {
      repourl.path = repourl.path || repourl.host
      ops.push(function (cb) {
        fetcher(reponame, repourl, cb)
      })
    } else {
      cb && cb(new Error("Unknown protocol " + protocol))
      return cb = null
    }
  })
  if (!cb) return
  async.parallel(ops, function (err, results) {
    if (!err) results = flatten(results, 2, true)
    cb(err, results)
  })
}

function getVersions (service, cb) {
  var cmd;
  if (service.type === "git") {
    cmd = "git ls-remote " + service.url
    exec(cmd, function (err, refs) {
      var temp = []
      refs && (refs = refs.split("\n").slice(0,-1))
      refs && refs.forEach(function (ref) {
        ref = ref.split("\t")[1].split("tags/")
        if (ref.length === 2) {
          ref = ref[1]
          if (ref.indexOf("^") === -1) {
            temp.push(ref)
          }
        }
      })
      if (temp[0] !== "HEAD") temp.push("HEAD")
      cb(err, temp)
    })
  } else if (service.type === "file") {
    cmd = "cd " + service.url + "; git tag"
    exec(cmd, function (err, data) {
      var versions = data.split("\n").slice(0, -1)
      cb(err, [ "HEAD" ].concat(versions.reverse()))
    })
  }
}


//
// action helpers
//

var fetchers = {
  "file": fetchFile,
  "directory": fetchDirectory,
  "github": fetchGithub,
  "https": fetchGit,
  "http": fetchGit,
  "git": fetchGit,
}

function fetchFile (repo, repourl, cb) {
  var cmd = "cd " + repourl.path + "; [ $? != 0 ] && exit 1; git status;"
  exec(cmd, function (err) {
    if (err) {
      repo = null
    } else {
      repo = {
        name: repo || repourl.prefix + "/" + path.basename(repourl.path),
        type: "file",
        url: repourl.path
      }
    }
    cb(null, repo)
  })
}

function fetchDirectory (dir, dirurl, cb) {
  var ops = null
  fs.readdir(dirurl.path, function (err, results) {
    if (err) {
      cb(err)
    } else {
      ops = results.map(function (repo) {
        return function (cb) {
          fetchFile(null, { prefix: dir, path: dirurl.path + "/" + repo }, cb)
        }
      })
      async.parallel(ops, cb)
    }
  })
}

function fetchGithub (username, usernameurl, cb) {
  var temp = []
  var u = "https://api.github.com/users/" + usernameurl.path + "/repos"
  getPage(u)
  function getPage (page) {
    request(page, function (err, res, body) {
      if (err) {
        cb(err)
      } else {
        try {
          body = JSON.parse(body)
          var link = res.headers.link
          if (link) link = link.split(",")[0].split(";")
          if (link) link = link.length > 1 && link[1].indexOf("next") >= 0 && link[0].slice(1,-1)
          if (link) {
            temp = temp.concat(body)
            getPage(link)
          } else {
            temp = temp.concat(body)
            cb(null, temp.map(function (repo) {
              return {
                name: usernameurl.path + "/" + repo.name,
                type: "git",
                url: repo.git_url
              }
            }))
          }
        } catch (err) {
          cb(err)
        }
      }
    })
  }
}

function fetchGit (repo, repourl, cb) {
  cb(null, {
    name: repo,
    type: "git",
    url: repourl.href
  })
}

function prepareDeploy (machine, repo, domain, version, cb) {
  var home = machine.root
  var cmd = "ssh -o StrictHostKeychecking=no -i " + machine.key + " " + machine.user + "@" + machine.address + " '\
  cd " + home + ";\
  if [ ! -e repos/" + repo.name + " ]; then\
    mkdir -p repos/" + repo.name + ";\
    cd repos/" + repo.name + ";\
    git init --bare;\
    cd " + home + ";\
  fi;\
  mkdir -p services;\
  if [ -e services/" + domain + "/" + version + " ]; then echo 1; else echo 0; fi\
  '"
  exec(cmd, function (err, stdout, stderr) {
    if (!err) {
      stdout = stdout.split("\n").slice(-2)[0]
    }
    cb(err, stdout)
  })
}

function updateVhosts (environment, machine, service, cb) {
  var vhosts = {}
  vhosts[service.name] = machine.address
  util.forEachHost(environment, null, function (machine, cb) {
    var cmd = "ssh -o StrictHostKeychecking=no -i " + host.key + " " + host.user + "@" + host.address + " '\
    cat /etc/hosts;\
    '"
    exec(cmd, function (err, data) {
      if (err) {
        cb(err)
      } else {
        var hosts = util.updateVhosts(data.slice(0,-1).split("\n"), vhosts)
        var cmd = "ssh -o StrictHostKeychecking=no -i " + host.key + " " + host.user + "@" + host.address + " '\
        echo \"" + hosts + "\" > /etc/hosts;\
        '"
        exec(cmd, cb)
      }
    });
  }, function (err, data) {
    if (err) {
      console.log("failed to update /etc/hosts on " + data.host.name + " " + (data.stderr || err))
    } else {
      console.log("updated /etc/hosts on " + data.host.name + " successfully")
    }
  }, cb)
}

function deploy (host, service, version, cb) {
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


//
//  utils
//

function flatten (arrayOfArrays, depth, removeFalsy) {
  if (Array.isArray(arrayOfArrays)) {
    var temp = []
    for (var a in arrayOfArrays) {
      var array = arrayOfArrays[a]
      if (depth) {
        array = flatten(array, depth-1, removeFalsy)
      } else if (depth !== undefined) {
        array = flatten(array, undefined, removeFalsy)
      }
      temp = temp.concat(array)
    }
    arrayOfArrays = temp
  }
  if (removeFalsy && !arrayOfArrays) arrayOfArrays = []
  return arrayOfArrays
}
