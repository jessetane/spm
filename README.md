```
 _____ _____ _____
||s  |||p  |||m  ||
||___|||___|||___||
|/___\|/___\|/___\|

```

## What
Deploy and command multiple versions of multiple services on multiple hosts in multiple environments.

## Why
Because the world needs more deploy tools.

## How
* local + directory: rsync
* local + git: git-push
* remote + git: git-fetch

## Installation
`git clone https://github.com/jessetane/spm.git`  
`cd spm`  
`npm install -g`

## Usage
1) Make a deploy.json file in a directory that describes your repos, services, machines & environments.  
2) Type a command like the ones below:  
* `spm`
* `spm deploy`
* `spm deploy <service>`

## License
MIT

## TODO
Right now, the tools exec out to the system's ssh and git or rsync, could this be done in pure javascript?  
* https://github.com/mscdex/ssh2
* https://github.com/hij1nx/git-stream