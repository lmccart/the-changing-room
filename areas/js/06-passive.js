// style and js imports
import $ from 'jquery';
import 'imagesloaded';

import '../css/06-passive.scss';
import './shared.js';
import { getImgUrls, addSvgFilterForElement } from './lib/imageColorUtils.js';

let emotions;
let curEmotion;
let imgURLs = [];
const socket = io();
socket.on('emotion:update', updateEmotion);

let popupFactory;

function updateEmotion(msg) {
  if (!curEmotion || curEmotion.name !== msg.name) {
    curEmotion = msg;
    console.log('emotion has been updated to: ' + msg.name + ' (base: ' + msg.base + ', level: ' + msg.level +')');
    updateInterface();
    showLoadingOverlay(curEmotion.name);
    updateInterface();
  }
}

async function updateInterface() {
  $('#debug-info').text('CURRENT EMOTION: ' + curEmotion.name + ' (base: ' + curEmotion.base + ', level: ' + curEmotion.level +')')
  imgURLs = await getImgUrls(curEmotion.base);
  if (popupFactory) {
    popupFactory.cleanup();
  }
  popupFactory = new PopupFactory(curEmotion);
}

// add elements at random, with a multiplier based on a single digit integer
// elements should self destruct, and not overlap too much with current objects on screen
// elements can be images, short text and single word emotion label

function PopupFactory (emotionObj) {
  // expects emotionObj to be the standard emotion data object we are using
  const parentEl = $('.main');
  const factoryThis = this;

  // note that the destruction rate is set in each individual popup for a little randomness
  const popupRate = 7500 / emotionObj.level; // base rate of 7.5 seconds, gets faster with higher emotion level
  const minDisplayTime = 2;// minimum time a popup shows on screen
  const overLapAllowance = 0.60; // allows 60% overlap when a new element is created

  factoryThis.emotion = emotionObj.name;
  factoryThis.activeElements = [];

  factoryThis.removeEl = (id) => {
    const index = factoryThis.activeElements.findIndex((element) => element.id = id);

    if (index >= 0 ) {
      factoryThis.activeElements.splice(index, 1);
    }
  }

  factoryThis.cleanup = () => {
    // remove all popups
    parentEl.empty();
    clearInterval(creationInterval);
  }

  factoryThis.getPercentOverlap = (existingEl, newEl) => {
    const l1=existingEl.offset().left-8;
    const t1=existingEl.offset().top-8;
    const w1=existingEl.outerWidth();
    const h1=existingEl.outerHeight();

    const l2=newEl.offset().left-8;
    const t2=newEl.offset().top-8;
    const w2=newEl.outerWidth();
    const h2=newEl.outerHeight();  

    const overLapWidth = Math.max(Math.min(l1+w1,l2+w2) - Math.max(l1,l2),0);
    const overLapHeight = Math.max(Math.min(t1+h1,t2+h2) - Math.max(t1,t2),0);
    const overLapArea = overLapHeight * overLapWidth;
    const overlapPercent = overLapArea / (w2 * h2);

    return overlapPercent;
  }

  factoryThis.getRandomPosition = ($element) => {
    const x = document.body.offsetHeight-$element.outerHeight();
    const y = document.body.offsetWidth-$element.outerWidth();
    const randomX = Math.floor(Math.random()*x);
    const randomY = Math.floor(Math.random()*y);
    return [randomX,randomY];
  }

  function PopupEl (multiplier) {
    const hasImage = true; // should be a random chance either true or false
    const hasText = false; // should be a random chance either true or false
    const childThis = this;
    childThis.id = Math.floor(Math.random() * 1000000);
    childThis.$element = $(`<div class="popup window" id=${childThis.id}>${childThis.id} — ${factoryThis.emotion}</div>`);
    
    // hide it so we can calculate it's position
    childThis.$element.css('visibility', 'hidden');

    if (hasImage) {
      // attach a color modified image
      const imageURL = imgURLs[Math.floor(Math.random() * imgURLs.length)];
      const imgEl = $(`<img src="${imageURL}">`);
      addSvgFilterForElement(imgEl, window.baseColors[curEmotion.base][emotionObj.level-1]);
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
      })
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
      console.log('removing pop up id:', childThis.id);
      // remove element from dom and from currentElement array
      childThis.$element.remove();

      factoryThis.removeEl(childThis.id);
    }

    const destroyRate = minDisplayTime + popupRate * ((Math.random() * 2) * emotionObj.level);


    setTimeout(childThis.destroy, destroyRate);
  }

  const creationInterval = setInterval(() => {
    // create a new element every so often
    const newEl = new PopupEl(emotionObj.level);

    factoryThis.activeElements.push(newEl)
  }, popupRate);
}


