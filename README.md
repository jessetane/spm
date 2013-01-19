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

## Installation
`git clone https://github.com/jessetane/spm.git`  
`cd spm`  
`npm install -g`

## Usage
1) Make a spm.json file in a directory that describes your repos, services, machines & environments.  
2) Type one of these commands:  
* spm deploy
* spm withdraw
* spm command
* spm connect

## License
MIT

## TODO
Right now, the tools exec out to the system's ssh and git or rsync, could this be done in pure javascript?  
* https://github.com/mscdex/ssh2
* https://github.com/hij1nx/git-stream
