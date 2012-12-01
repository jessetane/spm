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
	
	status
	services
		deploy
		withdraw
		command
	hosts
		logon


deployer production status

deployer production services status

deployer production services operator@v0.0.1 start
deployer production services operator@HEAD stop
deployer production services operator@HEAD uninstall

deployer development hosts localhost install operator HEAD
deployer development hosts localhost uninstall operator v0.0.1
deployer development hosts localhost logon

deployer development


## License
MIT
