'''
 ___ ___ _____ 
|_ -| . |     |
|___|  _|_|_|_|
    |_|

'''

## What
Deploy and command multiple versions of multiple services on multiple hosts in multiple environments.

## Why
Because the world needs more deploy tools.

## How
* services.json file describes your environments
* local + directory: rsync
* local + git: git-push
* remote + git: git-fetch

## Installation
git clone https://github.com/jessetane/spm.git
cd spm
npm install -g

## Usage
1) Make a deploy.json file in a directory.
2) Type a command like the ones below:
* `spm`
* `spm deploy`
* `spm deploy <service>`

## TODO
Right now, the tools exec out to the system's ssh and git or rsync, could this be done in pure javascript?
* https://github.com/mscdex/ssh2
* https://github.com/hij1nx/git-stream

## License
MIT