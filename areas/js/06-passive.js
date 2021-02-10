// style and js imports
import $ from 'jquery';
import 'imagesloaded';
const Papa = require('papaparse');
import seedrandom from 'seedrandom';

import '../css/06-passive.scss';
import './shared.js';
import { getImgUrls, addSvgFilterForElement, getTextColorForBackground, getPopupUrls } from './lib/imageColorUtils.js';

const basePopupRate = 2000; // adjusted based on emotion intensity
const minDisplayTime = 15000; // minimum time a popup shows on screen
const displayVariation = 30000;
const overlapAllowance = 0.50; // allows 60% overlap when a new element is created
const backgroundChangeTime = 20000; // adjusted based on emotion intensity
const portionFiltered = 1;//0.5; // portion of popups with svg filter applied

const POPUP = {
  IMAGE: 0,
  IMAGE_TEXT: 1,
  TEXT: 2,
  EXTRA: 3
};

const WIDTHS = [
  [600, 800],
  [500, 900],
  [600, 1000],
  [200, 300]
];

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
  const emotionLevelMultiplier = 1 ** emotionObj.level; // exponential scale
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
    const x = document.body.offsetHeight - $element.outerHeight() - 10;
    const y = document.body.offsetWidth - $element.outerWidth() - 10;
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

    switch (Math.floor(rng() * 4)) {
    case 0: 
      childThis.type = POPUP.IMAGE;
      break;
    case 1:
      childThis.type = POPUP.IMAGE_TEXT;
      break;
    case 2:
      childThis.type = POPUP.TEXT;
      break;
    default:
      childThis.type = POPUP.EXTRA;
    }

    const stringFallback = 'There is nothing you are afraid of.'; // used if string retrieval fails for some reason
    childThis.$element = $(`<div class='popup window ${childThis.type >= 3 ? 'extra' : ''}' id=${childThis.id}></div>`);

    // hide it so we can calculate it's position
    childThis.$element.css('visibility', 'hidden');

    if (childThis.type === POPUP.IMAGE || childThis.type === POPUP.IMAGE_TEXT) {
      // attach a color modified image
      const imageURL = imgUrls[Math.floor(Math.random() * imgUrls.length)];
      const imgEl = $(`<img src="${imageURL}">`);
      imgEl.height(randomBetween(WIDTHS[childThis.type]));
      const contrast = rng() < 0.5 ? '#FFFFFF' : '#000000';
      if (rng() < portionFiltered) {
        let n = rng();
        let svgColors = [colors[0], colors[1]];
        if (n < 0.33) {
          svgColors[0] = contrast;
        } else if (n < 0.66) {
          svgColors[1] = contrast;
        } else {

        }
        let svgId = addSvgFilterForElement(imgEl, svgColors);
        imgEl.attr('data-svgId', svgId);
      }
      childThis.$element.append(imgEl);
    }

    if (childThis.type === POPUP.IMAGE_TEXT || childThis.type === POPUP.TEXT) {
      // window.emotionStings is an array of objects with a length of 2
      const selectedData = window.emotionStrings[Math.floor(rng() * 2)][curEmotion.base];
      const string = selectedData[Math.floor(rng() * selectedData.length)] || stringFallback;
      const textEl = $(`<p class=${childThis.type === 1 ? 'text' : 'solo text'}>${string}</p>`);

      if (childThis.type === POPUP.IMAGE_TEXT) {
        // set text color based on color to make it easier to read
        const textColor = getTextColorForBackground(colors[0]);
        childThis.$element.css('color', textColor);

        // set border color to match text on just text elements
        childThis.$element.css('border-color', `#${colors[0]}`);
        childThis.$element.css('color', textColor);
      } else if (childThis.type === POPUP.TEXT) {
        let n = rng();
        if (n < 0.25) {
          childThis.$element.css('background', colors[0]);
        } else if (n < 0.5) {
          childThis.$element.css('background', colors[1]);
        } else {
          childThis.$element.css('background', `radial-gradient(${colors[0]},${colors[1]})`);
        }
      }

      childThis.$element.append(textEl);
    }

    if (childThis.type === POPUP.EXTRA) {
      const randomExtra = preloadedExtras[Math.floor(rng() * preloadedExtras.length)];
      const imgEl = $(`<img src='${randomExtra.src}'>`);
      childThis.$element.append(imgEl);
      imgEl.width(randomBetween(WIDTHS[childThis.type]));
    } else {
      childThis.$element.width(randomBetween(WIDTHS[childThis.type]));
    }

    childThis.$element.css('border-color', `#${colors[0]}`);
    childThis.$element.css('box-shadow', '0 0 30px gray');

    // append just the element, which is the first item in a jquery object's array
    parentEl.append(childThis.$element[0]);

    if (childThis.type !== POPUP.TEXT) {
      // we need to wait for the image to load before we measure it
      childThis.$element.imagesLoaded(() => {
        positionElement(childThis);
      }); 
    } else {
      positionElement(childThis);
    }

    childThis.destroy = () => {
      let x = childThis.$element.offset().left;
      let y = childThis.$element.offset().top;
      let w = window.innerWidth;
      let pos = {};
      let n = Math.random() < 0.25;
      if (n < 0.25) {
        pos.left = x - w;
      } else if (n < 0.5) {
        pos.left = x + w;
      } else if (n < 0.75) {
        pos.top = y - w;
      } else {
        pos.top = y + w;
      }
      childThis.$element.stop(true).animate(pos, 1000, () => {
        // remove element from dom and from currentElement array
        childThis.$element.remove();
        for (let c of childThis.$element.children()) {
          let svgId = $(c).attr('data-svgId');
          if (svgId) {
            $(`#${svgId}`).remove();
          }
        }
        factoryThis.removeEl(childThis.id);
      });
    };
    setTimeout(childThis.destroy, destroyRate);
  }


  function positionElement(popup) {
    let $element = popup.$element;
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
    let w = $element.width();
    let h = $element.height();
    let fs = $element.css('font-size');
    fs = fs.substring(0, fs.length - 2);
    $element.css('top', t);
    $element.css('left', l); 
    let blinkDur = 800; 
    $element.delay(blinkDur / 5)
    .animate({ width: w * 1.2, height: h * 1.2, top: t - w * .1, left: l - h * .1, fontSize: fs * 1.2}, blinkDur * 0.2)
    .animate({ width: w, height: h, top: t, left: l, fontSize: fs}, blinkDur * 0.2)
    .animate({ width: w * 1.2, height: h * 1.2, top: t - w * .1, left: l - h * .1, fontSize: fs * 1.2}, blinkDur * 0.2)
    .animate({ width: w, height: h, top: t, left: l, fontSize: fs * 1}, blinkDur * 0.2)
    .delay(blinkDur / 5)
    .fadeIn(0, function() { moveAll(popup);} );
  }

  function moveAll(popup) {
    if (!popup && factoryThis.activeElements.length < 2) return;
    let mover = popup ? popup : pickRandom(factoryThis.activeElements);
    let slideTime = Math.random() * 1000 + 200;
    let randomXY = factoryThis.getRandomPosition(mover.$element);
    console.log(mover);
    if (mover.type === POPUP.EXTRA || mover.type === POPUP.TEXT) {
      mover.$element.animate({
        top: randomXY[0],
        left: randomXY[1]
      }, slideTime);
    } else {
      mover.$element.css({top: randomXY[0], left: randomXY[1]});
    }
      // if (i === factoryThis.activeElements.length - 1) {
      //   $element.degree = 0;
      //   $element.timer;
      //   rotate($element);
      // }
  }
  setInterval(moveAll, 3000);
  
  // function rotate($element) {
  //   $element.css({ WebkitTransform: 'rotate(' + $element.degree + 'deg)'});                   
  //   $element.timer = setTimeout(function() {
  //     $element.degree += 2; 
  //     if ($element.degree <= 360) {
  //       rotate($element);
  //     } else {
  //       $element.css({ WebkitTransform: 'rotate(0)deg)'});     
  //     }
  //   }, 1);
  // }

  const newEl = new PopupEl(emotionObj.level);
  factoryThis.activeElements.push(newEl);

  setTimeout(() => {
    creationInterval = setInterval(() => {
      // create a new element every so often
      const newEl = new PopupEl(emotionObj.level);

      factoryThis.activeElements.push(newEl);
    }, popupRate);
  }, screenNumber * 0);

}

function randomBetween(a, b) {
  let min, max;
  if (typeof a === 'object') {
    min = a[0];
    max = a[1];
  } else {
    min = a;
    max = b;
  }
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * (arr.length-1))]; // skip most recent elt
}