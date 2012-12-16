/*
 *  Rsync.js
 *
 */


var fs = require("fs")
var exec = require("child_process").exec

module.exports = Rsync


function Rsync (repo) {
  this.repo = repo
}


//
//  instance
//

Rsync.prototype.move = function (service, machine, cb) {
  var repo = this.repo
  var dest = "lib/" + service.name + "/" + service.version
  fs.writeFileSync(repo.url + "/environment", service.environment) // HACK!
  var cmd = "rsync -auvz --rsync-path=\"mkdir -p " + dest + " && rsync\" " + repo.url + "/ " + machine.user + "@" + machine.address + ":" + dest + "/"
  exec(cmd, function (err, stdout, stderr) {
    fs.unlinkSync(repo.url + "/environment") // HACK!
    cb(err, stdout)
  })
}
