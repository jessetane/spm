# deployer
Deploy and control multiple versions of multiple services on multiple hosts in multiple environments.

## Why
The world needs more deployment tools, duh.

## How
Not sure yet.

## Usage
deployer

	* Welcome
	|-[ 1 ]- deploy *
	|-[ 2 ]- withdraw
	|-[ 3 ]- configure
	|-[ 4 ]- command
	|-[ 5 ]- logon

	* Pick an environment
	|-[ 1 ]- development
	|-[ 2 ]- staging *
	|-[ 3 ]- production

	* Pick a service
	|-[ 1 ]- all
	|-[ 2 ]- operator.vm1
	|-[ 3 ]- redis.one.staging.vm1
	|-[ 4 ]- redis.two.staging.vm1
	|-[ 5 ]- redis-app.one.staging.vm1 *
	|-[ 6 ]- redis-app.two.staging.vm1

	* Pick a version
	|-[ 1 ]- HEAD
	|-[ 2 ]- v0.0.2
	|-[ 3 ]- v0.0.1

	┌ Status
	├─┬ vm0
	| ├─[ 1 ]─ operator@HEAD : uptime 15 hours
	|	├─[ 2 ]─ one.redis@HEAD : uptime 10 hours
	|	├─[ 3 ]─ one.redis@v0.0.1 : crashed
	| └─[ 4 ]─ two.redis : not installed
	└─┬ vm1
	  ├─[ 5 ]─ operator@HEAD : uptime 14 hours
	 	├─[ 6 ]─ one.redis-app@HEAD : uptime 9 hours
	  └─[ 7 ]─ two.redis-app : not installed

	┌ Status
	└─┬ localhost
	  └─┬ operator
	 	| ├─[ 1 ] HEAD ─ uptime 15 hours
	 	|	└─[ 2 ] v0.0.1 ─ crashed
		└── one.redis ─ not installed
		└── two.redis ─ not installed
		└── one.redis-app ─ not installed
		└── two.redis-app ─ not installed
		
	Enter a number [1-2]: 2
	You chose: 2
	
	┌ operator@v0.0.2 on localhost
	├──[ 1 ] start
	├──[ 2 ] stop
	├──[ 3 ] status
	└──[ 4 ] install
	└──[ 5 ] uninstall
	
	
  ┌ actions
  ├──[ 1 ] deploy
  ├──[ 2 ] withdraw
  └──[ 3 ] manage


## License
MIT


{
	"hosts": {
	  "localhost": {
	    "address": "127.0.0.1",
	    "environment": "development",
	    "user": "jessetane",
	    "key": "~/.ssh/id_rsa"
	  }
	  "vm2": {
			"address": "192.168.50.12",
	    "environment": "staging",
	    "user": "jesse",
	    "key": "~/.ssh/id_rsa"
		},
		"vm0": {
			"address": "192.168.50.10",
	    "environment": "production",
	    "user": "jesse",
	    "key": "~/.ssh/id_rsa"
		},
		"vm1": {
			"address": "192.168.50.11",
	    "environment": "production",
	    "user": "jesse",
	    "key": "~/.ssh/id_rsa"
		}
	},
	"services": {
		"operator": "../../operator",
		"one.redis": "../../redis",
		"two.redis": "../../redis",
		"one.redis-app": {
			"source": "../../redis",
			"variables": {
				"REDIS_HOST": "one.redis"
			}
		}
		"two.redis-app": {
			"source": "../../redis",
			"variables": {
				"REDIS_HOST": "two.redis"
			}
		}
	}
}


environments
	services
		status
			- list services by host
				command
				connect
				withdraw
		deploy
			- list sources
			 	- list versions
					- list hosts
						-> d production deploy operator HEAD vm0
	hosts
		- list hosts
			status
			connect
			provision
			terminate
			image

d production hosts status
d production services status
d production services deploy operator HEAD vm0
d production services status "vm0 operator@HEAD" withdraw

