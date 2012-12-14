/*
 *  Repo.js
 *
 */


var fs = require("fs")
var util = require("./util")
var exec = require("child_process").exec
var path = require("path")
var async = require("async")
var urllib = require("url")
var request = require("request")


module.exports = Repo


function Repo (props) {
  util._extend(this, props)
}


//
//  static
//

Repo.parse = function (config, cb) {
  var ops = []
  var repos = config.repos
  Object.keys(repos).forEach(function (reponame) {
    var repourl = urllib.parse(repos[reponame])
    var protocol = (repourl.protocol) ? repourl.protocol.slice(0,-1) : "git"
    var parser = parsers[protocol]
    if (parser) {
      repourl.path = repourl.path || repourl.host
      ops.push(function (cb) {
        parser(reponame, repourl, cb)
      })
    } else {
      cb && cb(new Error("Unknown protocol " + protocol))
      return cb = null
    }
  })
  if (!cb) return
  async.parallel(ops, function (err, results) {
    if (!err) {
      config.repos = util.flatten(results, 2, true)
    }
    cb(err)
  })
}

var parsers = {
  "file": parseFile,
  "directory": parseDirectory,
  "github": parseGithub,
  "https": parseGit,
  "http": parseGit,
  "git": parseGit
}

function parseFile (repo, repourl, cb) {
  var cmd = "cd " + repourl.path + "; [ $? != 0 ] && exit 1; git status;"
  exec(cmd, function (err) {
    if (err) {
      // TODO handle non-git repos!
      repo = null
    } else {
      repo = new Repo({
        name: repo || repourl.prefix + "/" + path.basename(repourl.path),
        type: "local.git",
        url: repourl.path
      })
    }
    cb(null, repo)
  })
}

function parseDirectory (dir, dirurl, cb) {
  var ops = null
  fs.readdir(dirurl.path, function (err, results) {
    if (err) {
      cb(err)
    } else {
      ops = results.map(function (repo) {
        return function (cb) {
          parseFile(null, { prefix: dir, path: dirurl.path + "/" + repo }, cb)
        }
      })
      async.parallel(ops, cb)
    }
  })
}

function parseGithub (username, usernameurl, cb) {
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
              return new Repo({
                name: usernameurl.path + "/" + repo.name,
                type: "remote.git",
                url: repo.git_url
              })
            }))
          }
        } catch (err) {
          cb(err)
        }
      }
    })
  }
}

function parseGit (repo, repourl, cb) {
  cb(null, new Repo({
    name: repo, 
    type: "remote.git",
    url: repourl.href
  }))
}


//
//  instance
//

Repo.prototype.versions = function (cb) {
  var cmd;
  if (this.type === "remote.git") {
    cmd = "git ls-remote " + this.url
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
  } else if (this.type === "local.git") {
    cmd = "cd " + this.url + "; git tag"
    exec(cmd, function (err, data) {
      var versions = data.split("\n").slice(0, -1)
      cb(err, [ "HEAD" ].concat(versions.reverse()))
    })
  } else {
    cb(null, [ "HEAD" ])
  }
}
