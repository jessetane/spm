/*
 *  util.js
 *
 */

var util = require('util')
var Repo = require('./repo')
var Service = require('./service')
var Machine = require('./machine')

// merge the builtin util module with this one
util._extend(exports, util)

exports.collapse = function(str) {
  return str.replace(/\s+/g, ' ')
}

exports.ltrim = function(str) {
  return str.replace(/^\s+/, '')
}

exports.rtrim = function(str) {
  return str.replace(/\s+$/, '')
}

exports.trim = function(str) {
  return exports.rtrim(exports.ltrim(str))
}

exports.flatten = function(arrayOfArrays, depth, removeFalsy) {
  if (Array.isArray(arrayOfArrays)) {
    var temp = []
    for (var a in arrayOfArrays) {
      var array = arrayOfArrays[a]
      if (depth) {
        array = exports.flatten(array, depth-1, removeFalsy)
      } else if (depth !== undefined) {
        array = exports.flatten(array, undefined, removeFalsy)
      }
      temp = temp.concat(array)
    }
    arrayOfArrays = temp
  }
  if (removeFalsy && !arrayOfArrays) {
    arrayOfArrays = []
  }
  return arrayOfArrays
}

exports.loadConfig = function(cb) {
  var cui = require('cui')
  function load(filename) {
    try {
      if (filename.slice(0, 1) !== '/') {
        filename = process.cwd() + '/' + filename
      }
      var config = require(filename)
      cui.cache || (cui.cache = {})
      cui.cache.config = inflateConfig(config)
    } catch (err) {
      if (err.code !== 'MODULE_NOT_FOUND') {
        return err // probably a json parse error
      }
      cui.splice({
        title: 'no config file found.',
        type: 'fields',
        data: 'type the path to a config file: '
      })
      cui.splice(function(cb) {
        cb(load(cui.last(1)))
      })
    }
  }
  cb(load('spm'))
}

function inflateConfig(config) {
  
  // build Repo instances
  if (!config.repos) config.repos = {}
  for (var r in config.repos) {
    var repo = util._extend({}, config.repos[r])
    config.repos[r] = new Repo({ 
      name: r,
      url: repo
    })
  }
  
  // build Service instances
  for (var s in config.services) {
    var service = util._extend({}, config.services[s])
    service.name = s
    if (!service.repo) {
      throw new Error('service ' + s + ' must define a repo')
    }
    var repo = config.repos[service.repo]
    if (!repo) {
      repo = new Repo({
        name: service.name,
        url: service.repo
      })
      config.repos[repo.name] = repo
      service.repo = repo
    }
    config.services[s] = new Service(service)
  }
  
  // machines / environments
  if (!config.machines && !config.environments) {
    throw new Error('no machines or environments found')
  } else if (!config.machines) {
    config.machines = {}
  } else if (!config.environments) {
    config.environments = {}
  }
  
  // normalize environments
  for (var e in config.environments) {
    var environment = util._extend({}, config.environments[e])
    environment.name = e
    for (var m in environment.machines) {
      var machine = environment.machines[m]
      if (!machine instanceof Machine) {
        machine.name = m
        makeMachine(machine, environment)
      }
    }
  }
  
  // normalize machines
  for (var m in config.machines) {
    var machine = util._extend({}, config.machines[m])
    if (!(machine instanceof Machine)) {
      machine.name = m
      makeMachine(machine)
    }
  }
  
  // build Machine instances and normalize the environments lookup
  function makeMachine(machine, environment) {
    if (environment) {
      
      // if we have an explicit environment just use that
      machine.environment = environment.name
    } else {
      
      // if we don't have an explicit environment set it to 'default'
      if (!machine.environment) machine.environment = 'default'
      
      // try and get an environment reference
      environment = config.environments[machine.environment]
      
      // if we didn't get one, we are responsible for creating it
      if (!environment) {
        environment = { 'machines': {}}
        config.environments[machine.environment] = environment
      } else if (!environment.machines) {
        
        // it's possible that we found an environment 
        // that hasn't defined a machines lookup
        environment.machines = {}
      }
    }
    
    // if the environment defines variables or 
    // users, merge them onto their machines
    if (environment.variables) {
      machine.variables = util._extend(environment.variables, machine.variables)
    }
    if (environment.users) {
      machine.users = util._extend(environment.users, machine.users)
    }
    
    // if we don't have users by now, that's an error
    if (!machine.users || Object.keys(machine.users).length === 0) {
      throw new Error('the machine ' + machine.name + ' doesn\'t have any users')
    }
    
    // create the machine and store references to it
    machine = new Machine(machine)
    config.machines[m] = machine
    environment.machines[machine.name] = machine
  }
  
  return config
}
