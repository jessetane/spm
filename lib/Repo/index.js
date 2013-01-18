/*
 *  index.js (repo.js)
 *
 */

var fs = require('fs')
var util = require('../util')
var path = require('path')
var urllib = require('url')

module.exports = Repo

function Repo(repo) {
  var temp = urllib.parse(repo.url)
  repo.type = temp.protocol && temp.protocol.slice(0,-1) || 'local.raw'
  if (repo.type === 'git' ||
      repo.type === 'http' || 
      repo.type === 'https') {
    repo.type = 'remote.git'
  } else {
    if (repo.url.slice(0, 1) !== '/') {
      repo.url = process.cwd() + '/' + repo.url
    }
    if (!fs.existsSync(repo.url)) {
      throw new Error('repo \'' + repo.url + '\' does not exist - please check your services.json')
    }
    try {
      var git = fs.statSync(repo.url + '/.git').isDirectory()
      if (git) repo.type = 'local.git'
    } catch (err) {}
  }
  var klass = require('./' + repo.type)
  var instance = new klass
  return util._extend(instance, repo)
}

Repo.prototype.versions = function(cb) {
  cb(new Error('not implemented'))
}

Repo.prototype.move = function(cb) {
  cb(new Error('not implemented'))
}
