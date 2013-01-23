```
 _____ _____ _____
||s  |||p  |||m  ||
||___|||___|||___||
|/___\|/___\|/___\|

```

## What
A package manager for services.

## Why
Just felt like reinventing some wheels.

## How
* local + directory: rsync
* local + git: git-push
* remote + git: git-fetch

## Usage
1) Make an config file written in JSON or JavaScript that describes your services & machines:  
```json
{
	"services": {
		"one.com": {
			"repo": "path/to/repo"
		},
		"db.one.com": {
			"repo": "https://github.com/yourname/db"
		}
	},
	"machines": {
		"server-friendly-name": {
			"address": "domain-name-or-ip-address",
			"users": {
				"name": "/path/to/ssh-key",
			}
		}
	}
}
```

2) cd into the directory holding your config file and type `spm`

## Installation
```bash
git clone https://github.com/jessetane/spm.git
cd spm
npm install -g
```

## License
MIT

## TODO
* Tests
* A pretty print function for reporting command logs

Right now, the tools exec out to the system's ssh and git or rsync, could this be done in pure javascript?  
* https://github.com/mscdex/ssh2
* https://github.com/hij1nx/git-stream
