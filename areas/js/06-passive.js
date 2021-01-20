// style and js imports
import $ from 'jquery';
import 'imagesloaded';
const Papa = require('papaparse');

import '../css/06-passive.scss';
import './shared.js';
import { getImgUrls, addSvgFilterForElement, getTextColorForBackground } from './lib/imageColorUtils.js';

const basePopupRate = 6000; // adjusted based on emotion intensity
const minDisplayTime = 10000; // minimum time a popup shows on screen
const displayVariation = 4000;
const overLapAllowance = 0.60; // allows 60% overlap when a new element is created
const backgroundChangeTime = 20000; // adjusted based on emotion intensity
const portionFiltered = 0.25; // portion of popups with svg filter applied

let curEmotion;
let backgroundInterval;
let imgURLs = [];
let popupFactory; // used to reference the function that produces popups

window.emotionStrings = [];

window.init = () => {
  Promise.all([parseDirections(), parseReflections()])
    .then((results) => {
      socket.on('emotion:update', updateEmotion);
      socket.emit('emotion:get');
    });
};

function updateEmotion(msg) {
  if (!curEmotion || curEmotion.name !== msg.name) {
    curEmotion = msg;
    console.log('emotion has been updated to: ' + msg.name + ' (base: ' + msg.base + ', level: ' + msg.level + ')');
    showLoadingOverlay(curEmotion);
    updateInterface();
  }
}

async function updateInterface() {
  $('#debug-info').text('CURRENT EMOTION: ' + curEmotion.name + ' (base: ' + curEmotion.base + ', level: ' + curEmotion.level + ')');
  imgURLs = await getImgUrls(curEmotion.base);
  if (popupFactory) {
    popupFactory.cleanup(); 
  }
  
  popupFactory = new PopupFactory(curEmotion);

  if (backgroundInterval) {
    clearInterval(backgroundInterval);
  } 
  switchBackgrounds();;
  backgroundInterval = setInterval(() => {
    switchBackgrounds();
  }, (backgroundChangeTime / (1.6 ** curEmotion.level)));
}

function parseDirections() {
  return new Promise(resolve => {
    Papa.parse('/data/05_directions.tsv', {
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
    Papa.parse('/data/01_reflections.tsv', {
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

function switchBackgrounds() {
  const bgToHide = $('#background-1').is(':visible') ? $('#background-1') : $('#background-2');
  const bgToShow = $('#background-1').is(':visible') ? $('#background-2') : $('#background-1');
  
  const imgUrl = imgURLs[Math.floor(Math.random() * imgURLs.length)];
  let svgId = addSvgFilterForElement(bgToShow, window.baseColors[curEmotion.base][curEmotion.level % 3]);
  bgToShow.data('svgId', svgId);
  bgToShow.css('background-image', `url(${imgUrl})`);
  $('#loader').attr('src', imgUrl).off();
  $('#loader').attr('src', imgUrl).on('load', function() {
    bgToShow.fadeIn();
    bgToHide.fadeOut();
    setTimeout(() => {
      let svgId = bgToHide.data('svgId');
      $(`#${svgId}`).remove();
    }, 1000);
  });
}

// add elements at random, with a multiplier based on a single digit integer
// elements should self destruct, and not overlap too much with current objects on screen
// elements can be images, short text and single word emotion label

function PopupFactory(emotionObj) {
  // expects emotionObj to be the standard emotion data object we are using
  const parentEl = $('.main');
  const factoryThis = this;

  // note that the destruction rate is set in each individual popup for a little randomness
  const emotionLevelMultiplier = 2 ** emotionObj.level; // exponential scale
  const popupRate = basePopupRate / emotionLevelMultiplier; // base rate of ~3 seconds, gets faster with higher emotion level
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
    clearInterval(creationInterval);
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
    // 3 label -> just the label asset, which is an image

    const type = Math.floor(Math.random() * 4); // generates random number between 0 - 3;
    const hasImage = type !== 2; // should be a random chance either true or false
    const stringFallback = 'There is nothing you are afraid of.'; // used if string retrieval fails for some reason
    childThis.$element = $(`<div class='popup window ${type === 3 && 'label'}' id=${childThis.id}></div>`);

    // set up the colors
    childThis.$element.css('background', `#${colors[1]}`);
    childThis.$element.css('color', `#${colors[0]}`);

    // hide it so we can calculate it's position
    childThis.$element.css('visibility', 'hidden');

    if (type === 0 || type === 1) {
      // attach a color modified image
      const imageURL = imgURLs[Math.floor(Math.random() * imgURLs.length)];
      const imgEl = $(`<img src="${imageURL}">`);
      if (Math.random() < portionFiltered) {
        let svgId = addSvgFilterForElement(imgEl, window.baseColors[curEmotion.base][emotionObj.level - 1]);
        imgEl.attr('data-svgId', svgId);
      }
      childThis.$element.append(imgEl);
    }

    if (type === 1 || type === 2) {
      // insert some text
      // window.emotionStings is an array of objects with a length of 2
      const selectedData = window.emotionStrings[Math.floor(Math.random() * 2)][curEmotion.base];
      const string = selectedData[Math.floor(Math.random() * selectedData.length)] || stringFallback;
      const textEl = $(`<p class=${type === 1 ? 'text' : 'solo text'}>${string}</p>`);

      if (type === 1) {
        // set text color based on color to make it easier to read
        const textColor = getTextColorForBackground(colors[0]);
        childThis.$element.css('color', textColor);

        // set border color to match text on just text elements
        childThis.$element.css('border-color', `#${colors[0]}`);
      } 

      childThis.$element.append(textEl);
    }

    if (type === 3) {
      // set label image
      const imageURL = `/static/06-passive/${curEmotion.base}/label.jpg`;
      const imgEl = $(`<img class='label' src='${imageURL}'>`);
      childThis.$element.append(imgEl);
    }

    // append just the element, which is the first item in a jquery object's array
    parentEl.append(childThis.$element[0]);

    if (hasImage) {
    // we need to wait for the image to load before we measure it
      childThis.$element.imagesLoaded(() => {
      // set the initial position
        const randomXY = factoryThis.getRandomPosition(childThis.$element);
        childThis.$element.css('top', randomXY[0]);
        childThis.$element.css('left', randomXY[1]);

        for (var i = factoryThis.activeElements.length - 1; i >= 0; i--) {
          const testEl = factoryThis.activeElements[i];
          const overlapPercent = factoryThis.getPercentOverlap(testEl.$element, childThis.$element);

          if (overlapPercent > overLapAllowance) {
          // get new position values
            const randomXY = factoryThis.getRandomPosition(childThis.$element);
            childThis.$element.css('top', randomXY[0]);
            childThis.$element.css('left', randomXY[1]);
          }
        }

        childThis.$element.css('visibility', 'visible');
      }); 
    } else {
      // set the initial position
      const randomXY = factoryThis.getRandomPosition(childThis.$element);
      childThis.$element.css('top', randomXY[0]);
      childThis.$element.css('left', randomXY[1]);

      for (var i = factoryThis.activeElements.length - 1; i >= 0; i--) {
        const testEl = factoryThis.activeElements[i];
        const overlapPercent = factoryThis.getPercentOverlap(testEl.$element, childThis.$element);

        if (overlapPercent > overLapAllowance) {
          // get new position values
          const randomXY = factoryThis.getRandomPosition(childThis.$element);
          childThis.$element.css('top', randomXY[0]);
          childThis.$element.css('left', randomXY[1]);
        }
      }

      childThis.$element.css('visibility', 'visible');
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

  const creationInterval = setInterval(() => {
    // create a new element every so often
    const newEl = new PopupEl(emotionObj.level);

    factoryThis.activeElements.push(newEl);
  }, popupRate);
}


