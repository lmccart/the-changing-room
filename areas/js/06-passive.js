// style and js imports
import $ from 'jquery';
import 'imagesloaded';
const Papa = require('papaparse');
import seedrandom from 'seedrandom';

import '../css/06-passive.scss';
import './shared.js';
import { getImgUrls, addSvgFilterForElement, getTextColorForBackground, getPopupUrls } from './lib/imageColorUtils.js';

const basePopupRate = 10000; // adjusted based on emotion intensity
const minDisplayTime = 30000; // minimum time a popup shows on screen
const displayVariation = 4000;
const overlapAllowance = 0.60; // allows 60% overlap when a new element is created
const backgroundChangeTime = 20000; // adjusted based on emotion intensity
const portionFiltered = 1;//0.5; // portion of popups with svg filter applied

const POPUP = {
  IMAGE: 0,
  IMAGE_TEXT: 1,
  TEXT: 2,
  EXTRA: 3
};

let curEmotion;
let backgroundInterval;
let imgUrls = [];
let preloadedExtras = [];
let popupFactory; // used to reference the function that produces popups
let sharedSeed;

let urlParams = new URLSearchParams(window.location.search);
let screenNumber = urlParams.get('screen');

window.emotionStrings = [];

window.init = () => {
  if (screenNumber) {
    $('#area-extra').text('screen ' + screenNumber); 
  } else {
    $('#area-extra').text('missing screen id');
  }

  Promise.all([parseDirections(), parseReflections(), getPopupUrls()])
    .then((results) => {
      results[2].forEach(url => {
        let img = new Image();
        img.src = url;
        preloadedExtras.push(img);
      });
      socket.on('emotion:update', updateEmotion);
      socket.emit('emotion:get');
    });
};

function updateEmotion(msg) {
  if (!curEmotion || curEmotion.name !== msg.name) {
    curEmotion = msg;
    console.log('emotion has been updated to: ' + msg.name + ' (base: ' + msg.base + ', level: ' + msg.level + ', seed: ' + msg.seed + ')');
    sharedSeed = msg.seed;
    const durations = showLoadingOverlay(curEmotion);
    updateInterface(durations);
  }
}

async function updateInterface(durations) {
  $('#debug-info').text('CURRENT EMOTION: ' + curEmotion.name + ' (base: ' + curEmotion.base + ', level: ' + curEmotion.level + ')');
  imgUrls = await getImgUrls(curEmotion.base, curEmotion.level);
  const colors = window.baseColors[curEmotion.base][curEmotion.level - 1];
  // switchBackgrounds(imgUrls, durations[1] - durations[0] - 500, colors);
  $('body').css('background', `radial-gradient(${colors[1]},${colors[0]})`);
  $('.backgrounds').hide();

  if (backgroundInterval) clearInterval(backgroundInterval);
  backgroundInterval = setInterval(() => {
    switchBackgrounds(imgUrls, 500, colors);
  }, (backgroundChangeTime / (1.6 ** curEmotion.level)));

  if (popupFactory) {
    popupFactory.cleanup(); 
  }
  
  popupFactory = new PopupFactory(curEmotion);

}

function parseDirections() {
  return new Promise(resolve => {
    Papa.parse('/static/data/05_directions.tsv', {
      download: true,
      header: true,
      skipEmptyLines: 'greedy',
      complete: function(results) {
        const rawResults = results.data;
        const reordered = {};
        const keys = Object.keys(rawResults[0]);
        keys.forEach(key => reordered[key] = []);

        for (var i = 0; i < rawResults.length; i++) {
          const resultRow = rawResults[i];
          keys.forEach(key => resultRow[key].trim().length > 0 && reordered[key].push(resultRow[key]));
        }
        window.emotionStrings.push(reordered);
        resolve(window.emotionStrings);
      }
    });
  });
}

function parseReflections() {
  return new Promise(resolve => {
    Papa.parse('/static/data/01_reflections.tsv', {
      download: true,
      header: true,
      skipEmptyLines: 'greedy',
      complete: function(results) {
        const rawResults = results.data;
        const reordered = {};
        const keys = Object.keys(rawResults[0]);
        keys.forEach(key => reordered[key] = []);

        for (var i = 0; i < rawResults.length; i++) {
          const resultRow = rawResults[i];
          keys.forEach(key => resultRow[key].trim().length > 0 && reordered[key].push(resultRow[key]));
        }
        window.emotionStrings.push(reordered);
        resolve(window.emotionStrings);
      }
    });
  });
}


// add elements at random, with a multiplier based on a single digit integer
// elements should self destruct, and not overlap too much with current objects on screen
// elements can be images, short text and popups

function PopupFactory(emotionObj) {
  let rng = seedrandom(emotionObj.seed);
  // expects emotionObj to be the standard emotion data object we are using
  const parentEl = $('.main');
  const factoryThis = this;

  // note that the destruction rate is set in each individual popup for a little randomness
  const emotionLevelMultiplier = 2 ** emotionObj.level; // exponential scale
  const popupRate = basePopupRate / emotionLevelMultiplier; // base rate of ~3 seconds, gets faster with higher emotion level
  let creationInterval;
  const colors = window.baseColors[curEmotion.base][emotionObj.level - 1];

  factoryThis.emotion = emotionObj.name;
  factoryThis.activeElements = [];

  factoryThis.removeEl = (id) => {
    const index = factoryThis.activeElements.findIndex((element) => element.id = id);

    if (index >= 0) {
      factoryThis.activeElements.splice(index, 1); 
    }
    
  };

  factoryThis.cleanup = () => {
    // remove all popups
    parentEl.empty();
    if (creationInterval) clearInterval(creationInterval);
  };

  factoryThis.getPercentOverlap = (existingEl, newEl) => {
    const l1 = existingEl.offset().left - 8;
    const t1 = existingEl.offset().top - 8;
    const w1 = existingEl.outerWidth();
    const h1 = existingEl.outerHeight();

    const l2 = newEl.offset().left - 8;
    const t2 = newEl.offset().top - 8;
    const w2 = newEl.outerWidth();
    const h2 = newEl.outerHeight();  

    const overLapWidth = Math.max(Math.min(l1 + w1,l2 + w2) - Math.max(l1,l2),0);
    const overLapHeight = Math.max(Math.min(t1 + h1,t2 + h2) - Math.max(t1,t2),0);
    const overLapArea = overLapHeight * overLapWidth;
    const overlapPercent = overLapArea / (w2 * h2);

    return overlapPercent;
  };

  factoryThis.getRandomPosition = ($element) => {
    const x = document.body.offsetHeight - $element.outerHeight();
    const y = document.body.offsetWidth - $element.outerWidth();
    const randomX = Math.floor(Math.random() * x);
    const randomY = Math.floor(Math.random() * y);
    return [randomX,randomY];
  };


  function PopupEl(multiplier) {
    const childThis = this;
    const destroyRate = minDisplayTime + ((Math.random() * displayVariation));
    childThis.id = Math.floor(Math.random() * 1000000);

    // there are 4 types of popups: 
    // 0 image -> just an image
    // 1 image + text -> an image with text overlay
    // 2 text -> just text
    // 3+ popup -> random popup assets

    let type;
    switch (Math.floor(rng() * 5)) {
    case 0: 
      type = POPUP.IMAGE;
      break;
    case 1:
      type = POPUP.IMAGE_TEXT;
      break;
    case 2:
      type = POPUP.TEXT;
      break;
    default:
      type = POPUP.EXTRA;
    }

    const stringFallback = 'There is nothing you are afraid of.'; // used if string retrieval fails for some reason
    childThis.$element = $(`<div class='popup window ${type >= 3 ? 'extra' : ''}' id=${childThis.id}></div>`);

    // hide it so we can calculate it's position
    childThis.$element.css('visibility', 'hidden');

    if (type === POPUP.IMAGE || type === POPUP.IMAGE_TEXT) {
      // attach a color modified image
      const imageURL = imgUrls[Math.floor(rng() * imgUrls.length)];
      const imgEl = $(`<img src="${imageURL}">`);
      const contrast = rng() < 0.5 ? '#FFFFFF' : '#000000';
      if (rng() < portionFiltered) {
        let n = rng();
        let svgColors = [colors[0], colors[1]];
        if (n < 0.33) {
          // let contrast = getTextColorForBackground(colors[1]);
          svgColors[0] = contrast;
        } else if (n < 0.66) {
          // let contrast = getTextColorForBackground(colors[0]);
          svgColors[1] = contrast;
        } else {
          // let contrast = getTextColorForBackground(colors[0]);
          // svgColors[1] = contrast;

        }
        let svgId = addSvgFilterForElement(imgEl, svgColors);
        imgEl.attr('data-svgId', svgId);
      }
      childThis.$element.append(imgEl);
    }

    if (type === POPUP.IMAGE_TEXT || type === POPUP.TEXT) {
      // window.emotionStings is an array of objects with a length of 2
      const selectedData = window.emotionStrings[Math.floor(rng() * 2)][curEmotion.base];
      const string = selectedData[Math.floor(rng() * selectedData.length)] || stringFallback;
      const textEl = $(`<p class=${type === 1 ? 'text' : 'solo text'}>${string}</p>`);

      if (type === POPUP.IMAGE_TEXT) {
        // set text color based on color to make it easier to read
        const textColor = getTextColorForBackground(colors[0]);
        childThis.$element.css('color', textColor);

        // set border color to match text on just text elements
        childThis.$element.css('border-color', `#${colors[0]}`);
        childThis.$element.css('color', textColor);
      } else if (type === POPUP.TEXT) {
        let n = rng();
        if (n < 0.33) {
          childThis.$element.css('background', `radial-gradient(${colors[0]},${colors[1]})`);
        } else if (n < 0.66) {
          childThis.$element.css('background', colors[0]);
        } else {
          childThis.$element.css('background', colors[1]);
        }
      }

      childThis.$element.append(textEl);
    }

    if (type === POPUP.EXTRA) {
      const randomExtra = preloadedExtras[Math.floor(rng() * preloadedExtras.length)];
      const imgEl = $(`<img src='${randomExtra.src}'>`);
      childThis.$element.append(imgEl);
    }

    childThis.$element.css('border-color', `#${colors[0]}`);
    childThis.$element.css('box-shadow', '0 0 30px gray');

    // append just the element, which is the first item in a jquery object's array
    parentEl.append(childThis.$element[0]);

    if (type === POPUP.IMAGE || type === POPUP.IMAGE_TEXT || type === POPUP.EXTRA) {
      // we need to wait for the image to load before we measure it
      childThis.$element.imagesLoaded(() => {
        positionElement(childThis.$element);
      }); 
    } else {
      positionElement(childThis.$element);
    }

    childThis.destroy = () => {
      // remove element from dom and from currentElement array
      childThis.$element.remove();
      for (let c of childThis.$element.children()) {
        let svgId = $(c).attr('data-svgId');
        if (svgId) {
          $(`#${svgId}`).remove();
        }
      }
      factoryThis.removeEl(childThis.id);
    };
    setTimeout(childThis.destroy, destroyRate);
  }


  function positionElement($element) {
    let randomXY = factoryThis.getRandomPosition($element);
    let slideTime = Math.random() * 300 + 200;
  
    for (let i = factoryThis.activeElements.length - 1; i >= 0; i--) {
      const testEl = factoryThis.activeElements[i];
      const overlapPercent = factoryThis.getPercentOverlap($element, testEl.$element);
  
      if (overlapPercent > overlapAllowance) {
        randomXY = factoryThis.getRandomPosition($element);
      }
    }
    $element.css('visibility', 'visible');

    let t = (window.innerHeight - $element.height()) / 2;
    let l = (window.innerWidth - $element.width()) / 2;
    $element.css('top', t);
    $element.css('left', l);  
    $element.delay(300).fadeOut(0).delay(300).fadeIn(0).delay(300).fadeOut(0).delay(300).fadeIn(0).delay(300).animate({
      top: randomXY[0],
      left: randomXY[1]
    }, slideTime);
  }

  const newEl = new PopupEl(emotionObj.level);
  factoryThis.activeElements.push(newEl);

  setTimeout(() => {
    creationInterval = setInterval(() => {
      // create a new element every so often
      const newEl = new PopupEl(emotionObj.level);

      factoryThis.activeElements.push(newEl);
    }, popupRate);
  }, screenNumber * 150);
}
