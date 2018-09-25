Voting
=============

## Pre-install for ubuntu
1. Add Node.js PPA  
	+ sudo apt-get install curl python-software-properties  
	+ curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -  
		or  
		curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -  
2. Install Node.js on Ubuntu  
	+ sudo apt-get install nodejs  
3. Test Node.js and NPM Version  
	+ node -v   
	+ npm -v   
4. Install Voting Server packages  
	+ cd Vote/  
	+ npm install  
## Config file
1. Rename config_template.js to config.js
2. Fill in Oauth information (e.g. google client id, secret)
## How to start Voting Server
1. sudo node server.js
## Set join function on IotTalk
```
def run(*args):
    total = sum(args)    
    return [round(i/total, 2) for i in args]
```