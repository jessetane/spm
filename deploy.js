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


cui.push({
  title: "pick a repository to deploy",
  type: "buttons",
  data: function (cb) {
    exec("echo ~", function (err, path) {
      config = require(path.slice(0,-1) + "/.deploy.json")
      listRepos(config.repos, cb)
    })
  }
})

function loadConfig (file) {
  
}

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
                name: repo.name,
                type: "git",
                url: repo.url
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
