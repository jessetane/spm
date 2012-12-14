/*
 *  views.js
 *
 */


exports.Environments = function (environments) {
  this.title = "environments"
  this.type = "buttons"
  this.data = environments
}

exports.Machines = function (machines) {
  this.title = "machines"
  this.type = "buttons"
  this.data = machines
}

exports.Confirmation = function (service, version, machine) {
  this.type = "fields",
  this.data = service + "@" + version + " already exists on " + machine.name + ", do you want to overwrite? [Y/n]: "
}
