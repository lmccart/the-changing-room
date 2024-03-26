# The Changing Room 2.0

## Setup

1. Install Chrome
2. Install [XCode](https://developer.apple.com/xcode/resources/) and CL tools `xcode-select --install`
3. Install [nvm](https://github.com/nvm-sh/nvm). *(See [troubleshooting](https://github.com/nvm-sh/nvm#troubleshooting-on-macos), if needed.)*
4. Install Node.js with `nvm install node`
     * Install Node v18 with `nvm install 18`.
     * Your terminal should automatically use this version of Node, but you can double check with `node -v`. If it is using the wrong version, run `nvm use 18` and check once more with `node -v`
5. Install [VS Code](https://code.visualstudio.com/)
6. If you plan to commit changes to the repository, [add your key to GitHub](https://docs.github.com/en/free-pro-team@latest/github/authenticating-to-github/adding-a-new-ssh-key-to-your-github-account). Otherwise, you may skip this step.
7. Clone respository: `cd ~/Desktop && git clone git@github.com:lmccart/the-changing-room.git`
8. Install dependencies: `cd the-changing-room && npm install`
9. Use `.env-sample` to make a `.env` file, replace `localbook` with the name of your machine in all instances.
10. Add asset files to appropriate locations:
    * Add font files to `static/fonts/` (should look like `static/fonts/ABCFavoritMono-*.otf`)
    * Add image giles to `images/` (should look like `images/angry/#/image file name.jpg`)
    * Add video files to `images/videos`
    * Add popup files to `images/popups/`
    * Add sound files to `sound/sounds/` and `sound/sounds/reflection.` See the [sound README](https://github.com/lmccart/the-changing-room/blob/main/sound/README.md) for complete directory diagram.
11. The server runs on both HTTP (port 3001) and HTTPS (port 3000) to support this. To use with HTTPS, it requires either the installation of SSL certificates, or just clicking proceed anyway to get past browser warnings. On chrome if you don't see an option to proceed you can type thisisunsafe at the warning screen and it should proceed. [mkcert](https://github.com/FiloSottile/mkcert) will help setup a CA and certs, you'll need [homebrew](https://brew.sh/) to install mkcert.
    * `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`
    * `brew install mkcert`
    * `mkcert -install`
    * `mkcert [localname].local localhost`
12. Start server and webpack watcher: `npm start` (you may need to set: `export NODE_OPTIONS=--openssl-legacy-provider`)
13. Individual areas can be visited at the following paths (or on http at port 3001):
    * https://localhost:3000/00-intro
    * https://localhost:3000/01-faces
    * https://localhost:3000/02-reflection?screen=0,1,2
    * https://localhost:3000/03-selection
    * https://localhost:3000/04-convo1
    * https://localhost:3000/05-convo2
    * https://localhost:3000/06-passive
    * https://localhost:3000/07-rotating
    * https://localhost:3000/07-rotating-double/index0.html, https://localhost:3000/07-rotating-double/index1.html

### System Preferences

* Desktop background / Screensaver OFF
* Sleep / Display Off NEVER
* Do Not Disturb ON
* Software Updates OFF
* Default Browser CHROME
* File Sharing, Screen Sharing, Remote Login ON (name computer OCAX)

### Startup Tasks

1. Copy `install/TCR-LOCATIONS.txt` to Desktop
2. Copy `install/TCR-OCA*.app` to Desktop
3. Add login item
4. Install multibrowse
     * `pip3 install pyobjc`
     * `cd install/ && git clone https://github.com/foxxyz/multibrowse.git multibrowse-source`
5. Copy *.plist to `~/Library/LaunchAgents/`
6. Update paths and load:
     * `launchctl load com.TCR.plist`
7. Testing
     * `launchctl start com.TCR.plist`
     * `launchctl stop com.TCR.plist`

## Repository Structure

### Client

* `areas/` holds all served files related to the 7 different areas of the installation.
  - `areas/js/shared.js` includes some helper functions that get used on multiple pages.
  - `areas/js/lib/` contains extra script files imported by the main area scripts.
* `dist/` holds the served html/js/css files after they have been compiled by webpack.
* `images/` should contain all images and videos (see Mac setup section for where to place files).
* `sound/sounds/` contains the sound files played by either the server or client depending on soundType.
* `static/` holds static files that get served directly to the client (data, txt, etc), but because it's copied in build, it does not hold large files (images, videos, audio).
  - These files can be reached by URL in html, css, js `/static/filename`.
  - `static/data/` holds all text and content data for installation. It does not include `all-eomtions.json` because this is used server-side only.
  - Fonts are located in `static/fonts/` and are ignored by git, so you will need to add them

### Server
* `server.js` is the main server file.
* `server-lights.js` is the main lights server file.
* `server-fileUtils.js` is the main fileUtils file.
* `lights/` contains light server files for different light controllers.
* `sound/` contains the main sound server files.
  * `sound/server-sound-*` are three different options for playing sound. See the README in the sound folder for more info.
  * `sound/sounds/` contains the sound files played by either the server or client depending on soundType.

### Utils
* `colors/` holds utils for testing colors.
* `install/` holds script files for installation boot. [multibrowse](https://github.com/foxxyz/multibrowse) is used to open full-screen browser windows over multiple monitor setups.
* `logs/` holds all console and chat logs. Log files are rolled over daily. [log4js-node](https://github.com/log4js-node/log4js-node) handles the logging.
* `photoshop/` holds util scripts for processing images.
  

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
- `window.baseColors` or `baseColors` correspond to the data in `static/data/data.json` can be used like `basecolors[curEmotion.base][0]` which is `['a6588d', 'ffffff']`

## `areas/js/lib` functions and helpers
- can generally be used by importing like so:
    + `import { getImgUrls, addSvgFilterForElement } from './lib/imageColorUtils.js';`
- `imageColorUtils.js`
    + `getImgUrls (baseEmotion, level)` a function that returns an array of image urls for a certain base emotion
        - used like `const imageUrls = await getImgUrls('angry', 1);`
        - or `getImgUrls('angry', 1).then(imageUrls => {do whatever u want here})`
    + `addSvgFilterForElement ($imgEl, arrayOfColors)` this function adds an svg element to the document that has a multitone treatment, and sets css of the `$imgEl` (which is a jquery element) to use it as a filter `arrayOfColors` must be an array of 2 or more hex colors: `['7c4242', '584794', '608942']` (`#` infront of the color is optional)
    + `getDimensions(url)` returns promise that resolves to the width and height of an image url used like: 
        - `const imageDims = await getDimensions('/images/confused/image.jpeg');`
        - or `getDimensions('/images/confused/image.jpeg').then(imageDims => {do whatever u want here})`

## Translation

To accommodate non-English settings, *The Changing Room* uses the [i18next](https://www.i18next.com/) package for internationalization.

### Changing the language

*The Changing Room* uses a primary and secondary language system in order to function properly. It is recommended that English is always kept as the secondary language as a fallback for any translation failures. In most instances, the primary language is the only one shown, but sometimes both the primary and secondary langauges are shown, such as the 04-convo introduction.

In order to change the primary or secondary language, you will need to change the languages in two locations.

1. Change the language in `/static/data/data.json` to the desired langauge code. Often, these are two letters that represent the language (e.g. "en" for English or "fr" for French). You must use this same code for Step 2.
2. Change the language and voice in your `.env` file (see `.env-sample` for an example). For the language, use the desired langauge code. For the voice, you should use the desired voice for the Mac `say` command generate spoken audios for 02-reflection. Please see the [sound README](https://github.com/lmccart/the-changing-room/blob/main/sound/README.md) for more information on selecting a voice.
3. If you need to generate audios for this selected language, please see the [sound README](https://github.com/lmccart/the-changing-room/blob/main/sound/README.md) for information on editing the Python script to do so.

**If you would like to use only one language for *The Changing Room*, change both the primary and secondary languages to the same language code, rather than leaving secondary blank.**

### Adding a new language

In order to add a new language to *The Changing Room*, you must take some steps in addition to the ones above. After deciding a language code to use for the new language, such as "es" for Spanish, you will need to generate several files with translated information.

1. First, you must generate translated versions of all .txt and .tsv resources; tese files contain text assets used throughout the installation. These files will go in `/static/data/YOUR-LANG-CODE` (e.g. `/static/data/es`). The original of each file that needs to be translated can be found in `/static/data/en`. Here is the complete list of files needed:

* `00_intro_YOUR-LANG-CODE.txt`
* `01_self_YOUR-LANG-CODE.tsv`
* `02_meditation_emotion_specific_YOUR-LANG-CODE.tsv`
* `02_meditation_YOUR-LANG-CODE.txt`
* `02_memories_YOUR-LANG-CODE.tsv`\*
* `03_selection_intro_YOUR-LANG-CODE.txt`
* `04_convo1_intro_YOUR-LANG-CODE.txt`
* `04_substitutions_YOUR-LANG-CODE.tsv`\*
* `05_directions_YOUR-LANG-CODE.tsv`

\*Some .tsv files contain information in multiple langauges. For `02_memories.tsv`, this allows for memories in both languages to appear in the experience. For `04-substitutions.tsv`, this allows for substitutions across several languages.

2. You will also need to generate new audios for this language. Please see the [sound README](https://github.com/lmccart/the-changing-room/blob/main/sound/README.md) for information on editing the Python script to do so.

3. Next, you will need to generate an internationalization resource JSON called `translation.json` and place it in `/areas/js/locales/YOUR_LANG_CODE` (e.g. `/areas/js/locales/es`). This list should have several key-value pairs that i18next uses to serve the desired translations. You will need key-value pairs for the following:

* Each of the possible emotions
* Each of the file resources created in Step 1
* Various phrases used through out the app, such as fallback phrases. (*To ensure that phrases aren't missed, you should use another langauge's `translation.json` as a starting place.*)

If you create new keys not in other language's `translation.json`` files, you MUST add those new keys to these files or they may not return properly translated values in the future.

4. Lastly, in `areas/js/shared.js`, you must import the necessary translations and add them to the i18next resources on initialization (the `i18nInit` function). This should be fairly straightforward following the pre-exisiting examples. After you add these, they can stay here and do not be deleted in the future, even if you are not using them. By changing the primary and secondary langauges as in the previous section, you will ensure that extra languages are not used.


## Other Debug
* To autoplay sound from browser, chrome must be opened with this command line argument: `
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --autoplay-policy=no-user-gesture-required`

## References
* https://github.com/peter-murray/node-hue-api#readme
* https://developers.meethue.com/develop/get-started-2/
  
