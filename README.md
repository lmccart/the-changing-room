# The Changing Room 2.0

## Setup
1. Install [nodejs](https://nodejs.org/) (version 10.16 or newer)
2. Clone respository: https://github.com/lmccart/the-changing-room.git
3. Install dependencies: `npm install`
4. Add font files to `static/fonts/`
5. Add [image files](https://drive.google.com/file/d/1SsSHYPwk1jwX-A4SABYmn7RZQqwPsv2_/view?usp=sharing) to `images/` (should look like `images/angry/image file name.jpg`)
5. Start server and webpack watcher: `npm start`
6. Individual areas can be visited at the following paths (or on http at port 3001):
   - https://localhost:3000/00-intro
   - https://localhost:3000/01-faces
   - https://localhost:3000/02-reflection
   - https://localhost:3000/03-selection
   - https://localhost:3000/04-convo1
   - https://localhost:3000/05-convo2
   - https://localhost:3000/06-passive
7. The server also moves over to both HTTP (port 3001) and HTTPS (port 3000) to support this. To use with HTTPS, it requires either the installation of SSL certificates (this tool can help!), or just clicking proceed anyway to get past browser warnings. On chrome if you don't see an option to proceed you can type thisisunsafe at the warning screen and it should proceed.

## Repository Structure
* `areas/` holds all served files related to the 7 different areas of the installation.
  - `areas/js/shared.js` includes some helper functions that get used on multiple pages.
  - `areas/js/lib/` contains extra script files imported by the main area scripts.
* `logs/` holds all console and chat logs. Log files are rolled over daily. [log4js-node](https://github.com/log4js-node/log4js-node) handles the logging.
* `install/` holds script files for installation boot. [multibrowse](https://github.com/foxxyz/multibrowse) is used to open full-screen browser windows over multiple monitor setups.
* `dist/` holds the served html/js/css files after they have been compiled by webpack.
* `static/` holds static files that get served directly (images, txt, etc).
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
- `/popups/manifest` GET - returns array of image urls for all 06-passive popups

## Global variables
- `window.baseColors` or `baseColors` correspond to the data in `static/data/colors.json` can be used like `basecolors[curEmotion.base][0]` which is `['a6588d', 'ffffff']`

## `areas/js/lib` functions and helpers
- can generally be used by importing like so:
    + `import { getImgUrls, addSvgFilterForElement } from './lib/imageColorUtils.js';`
- `imageColorUtils.js`
    + `getImgUrls (baseEmotion)` a function that returns an array of image urls for a certain base emotion
        - used like `const imageURLs = await getImgUrls('angry');`
        - or `getImgUrls('angry').then(imageURLs => {do whatever u want here})`
    + `addSvgFilterForElement ($imgEl, arrayOfColors)` this function adds an svg element to the document that has a multitone treatment, and sets css of the `$imgEl` (which is a jquery element) to use it as a filter `arrayOfColors` must be an array of 2 or more hex colors: `['7c4242', '584794', '608942']` (`#` infront of the color is optional)
    + `getDimensions(url)` returns promise that resolves to the width and height of an image url used like: 
        - `const imageDims = await getDimensions('/images/confused/image.jpeg');`
        - or `getDimensions('/images/confused/image.jpeg').then(imageDims => {do whatever u want here})`

## References
* https://github.com/peter-murray/node-hue-api#readme
* https://developers.meethue.com/develop/get-started-2/
  
## Install Notes

* OCA1 MacPro will be driving the 4 Passive Influence Monitors.
User: Venessa Castagnoli 1, Pwd: OCA2020
* OCA2 MacPro is driving the large projector in the main floor, and the stitched projection.
User: Venessa Castagnoli 2, Pwd: OCA2020
* OCA3 MacPro will be driving the 4 touch-screen monitors.
User: Venessa Castagnoli 3, Pwd: OCA2020
* OCA4 (TBD Mac) will be driving the 2 projections in the Conversation Room 2

### Mac Setup
1. System Prefs
   * Desktop background / Screensaver OFF
   * Sleep / Display Off NEVER
   * Do Not Disturb ON
   * Software Updates OFF
   * Default Browser CHROME
   * File Sharing, Screen Sharing, Remote Login ON (name computer OCAX)
2. Setup software and tools
   * Install Chrome
   * Install [nodejs](https://nodejs.org/) (version 10.16 or newer)
   * Install [VS Code](https://code.visualstudio.com/)
   * [Add key to GitHub](https://docs.github.com/en/free-pro-team@latest/github/authenticating-to-github/adding-a-new-ssh-key-to-your-github-account)
   * Clone respository: `cd ~/Desktop && git clone git@github.com:lmccart/the-changing-room.git`
   * Install dependencies: `cd the-changing-room && npm install`
   * Add [font files](https://drive.google.com/file/d/1uY_hy7aX85moy8OlNFx_nO7liEZoGIL-/view?usp=sharing) to `static/fonts/` (should look like `static/fonts/ABC...`)
   * Add [image files](https://drive.google.com/file/d/1SsSHYPwk1jwX-A4SABYmn7RZQqwPsv2_/view?usp=sharing) to `images/` (should look like `images/angry/image file name.jpg`)
   * Add [popup files](#) to `static/popups/` 
   * Add [sound files](#)to `sound/sounds/`
3. Setup startup tasks
   * Copy `install/TCR-LOCATIONS.txt` to Desktop
   * Copy `install/TCR-OCA*.app` to Desktop
   * Install multibrowse
     * `pip3 install pyobjc`
     * `cd install/ && git clone https://github.com/foxxyz/multibrowse.git multibrowse-source`
   * Copy *.plist to `~/Library/LaunchAgents/`
   * Update paths and load:
     * `launchctl load com.TCR.plist`
     * `launchctl load screen.TCR.plist`