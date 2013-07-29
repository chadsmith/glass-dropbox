# Send to Dropbox for Google Glass

Send your Glass photos and videos to Dropbox.

##Prerequisites

* Google Glass w/ access to Mirror API
* Node.js, NPM
* [Dropbox API app](https://www.dropbox.com/developers/apps)

## Installation

`npm install` or `npm install express request googleapis dbox`

## Configuration

* Create a new [Google APIs Project](https://code.google.com/apis/console)
* Enable the Google Mirror API
* Create an OAuth 2.0 client ID for a web application
* Enter your server's hostname and port in [app.js](https://github.com/chadsmith/glass-dropbox/blob/master/app.js#L8-L11)
* Enter your Mirror API credentials in [app.js](https://github.com/chadsmith/glass-dropbox/blob/master/app.js#L12-L15)
* Create a [Dropbox API app](https://www.dropbox.com/developers/apps) for files and limit it to a private folder
* Enter your Dropbox app credentials in [app.js](https://github.com/chadsmith/glass-dropbox/blob/master/app.js#L16-L19)

## Usage

`node app` or `forever start app.js`

* Authorize the app by visiting http://hostname:port/ on your computer
* Share photos and videos with the Dropbox contact to save them in your app's folder