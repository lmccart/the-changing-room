// style and js imports
import '../css/06-passive.scss';
import './shared.js';

let emotions;
let curEmotion;
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

function updateInterface() {
  $('#debug-info').text('CURRENT EMOTION: ' + curEmotion.name + ' (base: ' + curEmotion.base + ', level: ' + curEmotion.level +')')

  if (!popupFactory || popupFactory.emotion !== curEmotion.name) {
    popupFactory = new PopupFactory(curEmotion);
  }
}

// add elements at random, with a multiplier based on a single digit integer
// elements should self destruct, and not overlap too much with current objects on screen
// elements can be images, short text and single word emotion label

function PopupFactory (emotionObj) {
  // expects emotionObj to be the standard emotion data object we are using
  const parentEl = $('.main')[0];
  const factoryThis = this;
  const popupRate = 9500 / emotionObj.level // level 3 = ~1.5 seconds

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
    const childThis = this;
    childThis.id = Math.floor(Math.random() * 1000000);
    childThis.$element = $(`<div class="popup" id=${childThis.id}>${childThis.id} — ${factoryThis.emotion} — With a test string</div>`);
    
    // hide it so we can calculate it's position
    childThis.$element.css('visibility', 'hidden');

    // append just the element, which is the first item in a jquery object's array
    parentEl.append(childThis.$element[0]);

    // set the initial position
    const randomXY = factoryThis.getRandomPosition(childThis.$element);
    childThis.$element.css('top', randomXY[0]);
    childThis.$element.css('left', randomXY[1]);

    for (var i = factoryThis.activeElements.length - 1; i >= 0; i--) {
      const testEl = factoryThis.activeElements[i];
      const overlapPercent = factoryThis.getPercentOverlap(testEl.$element, childThis.$element);
      console.log(overlapPercent);
      if (overlapPercent > .50) {
        // get new position values
        console.log(overlapPercent, 'repositioning');
        const randomXY = factoryThis.getRandomPosition(childThis.$element);
        childThis.$element.css('top', randomXY[0]);
        childThis.$element.css('left', randomXY[1]);
      }
    }

    childThis.destroy = () => {
      console.log('removing pop up id:', childThis.id);
      // remove element from dom and from currentElement array
      childThis.$element.remove();

      factoryThis.removeEl(childThis.id);
    }

    // append just the element, which is the first item in a jquery object's array
    childThis.$element.css('visibility', 'visible');

    const destroyRate = popupRate * ((Math.random() * 2) * emotionObj.level);


    setTimeout(childThis.destroy, destroyRate);
  }

  setInterval(() => {
    // create a new element every so often
    const newEl = new PopupEl(emotionObj.level);

    factoryThis.activeElements.push(newEl)
  }, popupRate);
}


