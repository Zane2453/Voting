#Voting

##Pre-install for ubuntu
1. Add Node.js PPA  
	i. sudo apt-get install curl python-software-properties
	ii. curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
		or
		curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
2. Install Node.js on Ubuntu
	i. sudo apt-get install nodejs
3. Test Node.js and NPM Version
	i. node -v 
	ii. npm -v 
4. Install Voting Server packages
	i. cd Vote/
	ii. npm install

##How to start
1. node server.js