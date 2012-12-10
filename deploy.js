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
// move the code
// run hooks

cui.push({
  title: "pick a repository to deploy",
  type: "buttons",
  data: function (cb) {
    exec("echo ~", function (err, path) {
      config = loadConfig()
      listRepos(config.repos, cb)
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


//
//  views
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

var domains = {
  type: "fields",
  data: "comma seperated list of domains: "
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
  repos.forEach(function (repo) {
    var repourl = url.parse(repo)
    var protocol = repourl.protocol.slice(0,-1)
    var fetcher = fetchers[protocol]
    if (fetcher) {
      repourl.path = repourl.path || repourl.host
      ops.push(function (cb) {
        fetcher(repo, repourl, cb)
      })
    } else {
      cb && cb(new Error("Unknown protocol " + protocol))
      return cb = null
    }
  })
  if (!cb) return
  async.parallel(ops, function (err, results) {
    if (!err) results = flatten(results, 2)
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
  fs.exists(repourl.path, function (status) {
    var err = null
    if (!status) {
      err = new Error(repourl.path + " does not exist")
      repo = null
    } else {
      repo = {
        name: "local/" + path.basename(repourl.path),
        type: "file",
        url: repourl.path
      }
    }
    cb(err, repo)
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
          fetchFile(null, { path: dirurl.path + "/" + repo }, cb)
        }
      })
      async.parallel(ops, cb)
    }
  })
}

function fetchGithub (username, usernameurl, cb) {
  var temp = []
  getPage("https://api.github.com/users/" + usernameurl.path + "/repos")
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
  var parts = repo.split("/")
  var name = parts.slice(-2)[0] + "/" + parts.slice(-1)[0].split(".")[0]
  cb(null, {
    name: name,
    type: "git",
    url: repo
  })
}


//
//  utils
//

function flatten (arrayOfArrays, depth) {
  if (Array.isArray(arrayOfArrays)) {
    var temp = []
    for (var a in arrayOfArrays) {
      var array = arrayOfArrays[a]
      if (depth) {
        array = flatten(array, depth-1)
      } else if (depth !== undefined) {
        array = flatten(array)
      }
      temp = temp.concat(array)
    }
    arrayOfArrays = temp
  }
  return arrayOfArrays
}
