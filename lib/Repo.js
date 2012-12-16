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
    var repo = repos[reponame]
    if (typeof repo !== "object") {
      repo = {
        name: reponame
        url: repo
      }
    }
    var urlParts = urllib.parse(repo.url)
    repo.protocol = (urlParts.protocol) ? urlParts.protocol.slice(0,-1) : "git"
    var parser = parsers[protocol]
    if (parser) {
      repo.path = urlParts.path || urlParts.host
      ops.push(function (cb) {
        parser(repo, cb)
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
  var cmd = "cd " + repourl.path + ";\
  [ $? != 0 ] && exit 1;\
  git status;\
  [ $? == 0 ] && echo 'git'"
  exec(cmd, function (err, stdout, stderr) {
    if (!err) {
      repo = new Repo({
        name: repo || repourl.prefix + "/" + path.basename(repourl.path),
        url: repourl.path
      })
      repo.type = (stdout === "git") ? "local.git" : "local.file"
    }
    cb(err, repo)
  })
}

function parseDirectory (repo, cb) {
  var ops = null
  fs.readdir(repo.path, function (err, results) {
    if (err) {
      cb(err)
    } else {
      ops = results.map(function (repoName) {
        return function (cb) {
          var candidate = util._extend({}, repo)
          candidate.name = repoName
          
          var path = dirurl.path + "/" + repo
          parseFile(candidate, cb)
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

Repo.prototype.__defineGetter__("transport", function () {
  var transport = null
  if (this.type === "local.file") {
    transport = new (require("./transport/Rsync"))(this)
  } else {
    transport = new (require("./transport/Git"))(this)
  }
  return transport
})
