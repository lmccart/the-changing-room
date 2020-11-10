# The Changing Room 2.0

## Setup
1. Install [nodejs](https://nodejs.org/)
2. Clone respository: https://github.com/lmccart/the-changing-room.git
3. Install dependencies: `npm install`
4. Start server and webpack watcher: `npm start`
5. Individual areas can be visited at the following paths:
   - http://localhost:3000/00-intro
   - http://localhost:3000/01-faces
   - http://localhost:3000/02-reflection
   - http://localhost:3000/03-selection
   - http://localhost:3000/04-convo1
   - http://localhost:3000/05-convo2
   - http://localhost:3000/06-passive

## Repository Structure
* `areas/` holds all served files related to the 7 different areas of the installation.
  - `areas/js/shared.js` includes some helper functions that get used on multiple pages.
  - `areas/js/lib/` contains extra script files imported by the main area scripts.
* `logs/` holds all console and chat logs. Log files are rolled over daily. [log4js-node](https://github.com/log4js-node/log4js-node) handles the logging.
* `automate/` holds script files for installation boot. [multibrowse](https://github.com/foxxyz/multibrowse) is used to open full-screen browser windows over multiple monitor setups.
* `dist/` holds the served html/js/css files after they have been compiled by webpack.
* `static/` holds static files that get copied into the `dist` folder (images, txt, etc).
  - These files can be reached by URL in html, css, js `/static/filename`.
* `server.js` is the main server file


## Overview
* This software is designed to work without outside internet connection. Server and all clients will be on the same LAN.
* [Socket.io](http://socket.io/) is used to handle all communication between server and client pages.
* All emotions are stored in all-emotions.json and loaded by the server. The server keeps track of `curEmotion` and writes this to `current.txt` on each emotion change so it persists between server restarts.
* Emotions are selected in `04-selection`. On selection, a message is sent to the server who updates its internal tracking and emits this updated emotion to all clients.
* Sound runs through Sonos using [node-sonos](https://github.com/bencevans/node-sonos#readme). If no Sonos speakers are found, software should still run.