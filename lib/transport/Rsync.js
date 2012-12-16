/*
 *  Rsync.js
 *
 */


module.exports = Rsync


function Rsync (repo) {
  this.repo = repo
}


//
//  instance
//

Rsync.prototype.move = function (service, cb) {
  var machine = service.machine
  var cmd = "rsync -auvz " + this.repo.url + " " + machine.user + "@" + machine.address + ":src/" + this.repo.name
  exec(cmd, function (err, stdout, stderr) {
    cb(err, stdout)
  })
}
