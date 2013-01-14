/*
 *  views.js
 *
 */

exports.RawVersions = function() {
  this.type = 'fields'
  this.data = 'version [HEAD]: '
}

exports.GitVersions = function(repo) {
  this.title = 'versions'
  this.type = 'buttons'
  this.data = function(cb) {
    repo.versions(cb)
  }
}

exports.Environments = function(environments) {
  this.title = 'environments'
  this.type = 'buttons'
  this.data = environments
}

exports.Machines = function(machines) {
  this.title = 'machines'
  this.type = 'buttons'
  this.data = machines
}

exports.Confirmation = function(service) {
  this.type = 'fields',
  this.data = service.name + '@' + service.version + ' is already deployed - do you want to overwrite? [Y/n]: '
}
