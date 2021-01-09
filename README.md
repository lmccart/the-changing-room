# The Changing Room 2.0

## Setup
1. Install [nodejs](https://nodejs.org/) (version 10.16 or newer)
2. Clone respository: https://github.com/lmccart/the-changing-room.git
3. Install dependencies: `npm install`
4. Add font files to `static/fonts/`
5. Add [image files](https://drive.google.com/file/d/1SsSHYPwk1jwX-A4SABYmn7RZQqwPsv2_/view?usp=sharing) to `static/images/` (should look like `static/image/angry/image file name.jpg`)
5. Start server and webpack watcher: `npm start`
6. Individual areas can be visited at the following paths:
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
  - Fonts are located in `static/fonts/` and are ignored by git, so you will need to add them (message sam if you need the link to the files)
* `server.js` is the main server file


## Overview
* This software is designed to work without outside internet connection. Server and all clients will be on the same LAN.
* [Socket.io](http://socket.io/) is used to handle all communication between server and client pages.
* All emotions are stored in all-emotions.json and loaded by the server. The server keeps track of `curEmotion` and writes this to `current.txt` on each emotion change so it persists between server restarts.
* Emotions are selected in `04-selection`. On selection, a message is sent to the server who updates its internal tracking and emits this updated emotion to all clients.
* Sound runs through Sonos using [node-sonos](https://github.com/bencevans/node-sonos#readme). If no Sonos speakers are found, software should still run.

## API Endpoints
- `/emotions` GET - returns all emotions as JSON object
- `/images/:baseEmotion/manifest` GET - returns array of image urls for a base emotion (angry, sad, strong, etc)

## Global variables
- `window.baseColors` or `baseColors` correspond to the data in `data/colors.json` can be used like `basecolors[curEmotion.base][0]` which is `["a6588d", "ffffff"]`

## `areas/js/lib` functions and helpers
- can generally be used by importing like so:
    + `import { getImgUrls, addSvgFilterForElement } from './lib/imageColorUtils.js';`
- `imageColorUtils.js`
    + `getImgUrls (baseEmotion)` a function that returns an array of image urls for a certain base emotion
        - used like `const imageURLs = await getImgUrls('angry');`
        - or `getImgUrls('angry').then(imageURLs => {do whatever u want here})`
    + `addSvgFilterForElement ($imgEl, arrayOfColors)` this function adds an svg element to the document that has a multitone treatment, and sets css of the `$imgEl` (which is a jquery element) to use it as a filter `arrayOfColors` must be an array of 2 or more hex colors: `["7c4242", "584794", "608942"]` (`#` infront of the color is optional)
    + `getDimensions(url)` returns promise that resolves to the width and height of an image url used like: 
        - `const imageDims = await getDimensions('/static/images/confused/image.jpeg');`
        - or `getDimensions('/static/images/confused/image.jpeg').then(imageDims => {do whatever u want here})`

## References
* https://github.com/peter-murray/node-hue-api#readme
  
  
## Install Notes

* OCA1 MacPro will be driving the 4 Passive Influence Monitors.
User: Venessa Castagnoli 1, Pwd: OCA2020
* OCA2 MacPro is driving the large projector in the main floor, and the stitched projection.
User: Venessa Castagnoli 2, Pwd: OCA2020
* OCA3 MacPro will be driving the 4 touch-screen monitors.
User: Venessa Castagnoli 3, Pwd: OCA2020
* OCA4 (TBD Mac) will be driving the 2 projections in the Conversation Room 2