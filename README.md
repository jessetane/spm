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


## License
MIT
