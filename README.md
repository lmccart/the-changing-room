# The Changing Room 2.0

## Setup
1. Install [nodejs](https://nodejs.org/)
2. Clone respository: https://github.com/lmccart/the-changing-room.git
3. Install dependencies: `npm install`
4. Start server: `node server.js`
5. Individual areas can be visited at the following paths:
   - http://localhost:3000/01-intro
   - http://localhost:3000/02-faces
   - http://localhost:3000/03-reflection
   - http://localhost:3000/04-selection
   - http://localhost:3000/05-convo1
   - http://localhost:3000/06-convo2
   - http://localhost:3000/07-passive

## Repository Structure
* `areas/` holds all served files related to the 7 different areas of the installation.
* `logs/` holds all console and chat logs. Log files are rolled over daily. [log4js-node](https://github.com/log4js-node/log4js-node) handles the logging.
* `scripts/` holds script files for installation boot
* `server.js` is the main server file

## Overview
* This software is designed to work without outside internet connection. Server and all clients will be on the same LAN.
* [Socket.io](http://socket.io/) is used to handle all communication between server and client pages.
* All emotions are stored in all-emotions.json and loaded by the server. The server keeps track of `curEmotion` and writes this to `current.txt` on each emotion change so it persists between server restarts.
* Emotions are selected in `04-selection`. On selection, a message is sent to the server who updates its internal tracking and emits this updated emotion to all clients.
