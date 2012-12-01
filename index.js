#!/usr/bin/env node

/*
 *  deployer.js
 *
 */


var cui = require("cui");
var util = require("./lib/util");
var views = require("./lib/views");
var config = require("./lib/config");
var actions = require("./lib/actions");

cui.push(views.environments);

cui.push({
  title: "actions",
  type: "buttons",
  data: [
    "deploy",
    "withdraw",
    "status",
    "logon"
  ],
  action: function (cb) {
    var action = cui.last(1);
    if (action === "deploy") {
      cui.push(views.services);
      cui.push(views.versions);
      cui.push(function (cb) {
        var environment = cui.results[0];
        var service = cui.last(2);
        var version = cui.last(1);
        actions.deploy(service, version, environment);
        cb();
      });
    } else if (action === "status") {
      cui.push(views.status);
    }
    cb();
  }
})


/*
cui.push({
  title: "Welcome",
  type: "buttons",
  data: [
    "Services",
    "Machines"
  ],
  action: function (cb) {
    var choice = cui.results.slice(-1)[0];
    if (choice) {
      switch (choice.toLowerCase()) {
        case "deploy":
          cui.push(environments);
          cui.push(services);
          cui.push(versions);
          cui.push(function (cb) {
            var environment = cui.last(3);
            var service = cui.last(2);
            var version = cui.last(1);
            deploy(service, version, environment);
            cb();
          });
          break;
        case "withdraw":
          cui.push(environments);
          cui.push(servicesLive);
          cui.push(versionsLive);
          cui.push(confirm);
          cui.push(function (cb) {
            var environment = cui.last(4);
            var service = cui.last(3);
            var version = cui.last(2);
            if (cui.last(1) && cui.last(1).toLowerCase().search("y") === 0) {
              withdraw(environment, service, version, cb);
            } else {
              console.log("Withdrawal aborted");
            }
          });
          break;
        case "configure":
          cui.push(environments);
          cui.push(function (cb) {
            configure(cui.last(1), cb);
          });
          break;
        case "apps":
          cui.push(environments);
          cui.push(function (cb) {
            processes(cui.last(1), cb);
          });
          break;
        case "command":
          cui.push(environments);
          cui.push(servicesLive);
          cui.push(versionsLive);
          cui.push(scripts);
          cui.push(function (cb) {
            var environment = cui.last(4);
            var service = cui.last(3);
            var version = cui.last(2);
            var script = cui.last(1);
            command(environment, service, version, script, "", cb);
          });
          break;
        case "servers":
          cui.push(environments);
          cui.push(hosts);
          cui.push(function (cb) {
            var host = cui.last(1);
            logon(host, cb);
          });
          break;
      }
      cb();
    }
  }
});
*/
