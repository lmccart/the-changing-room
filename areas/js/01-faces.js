// style and js imports
import $ from 'jquery';
import '../css/01-faces.scss';
import './shared.js';
import 'fancy-textfill/es2015/jquery.plugin';
import { getTextColorForBackground } from './lib/imageColorUtils.js';
import Papa from 'papaparse';
// import { enableAutoTTS, speak} from './lib/speech.js';

const ipadWidth = 810;
const ipadHeight = 1060;
const typingSpeed = 60;
let phraseInterval = 15000; 
const delaySeconds = 0.5; // seconds to wait before showing/hiding video

let curEmotion;
let spellOut = false; // used to determine when to animate text
let phraseTimeout;
let typingTimeout;
let phrasesL0;
let phrasesL1;
let emotionPhrasesL0;
let emotionPhrasesL1;
let curPhraseL0 = 0;
let curPhraseL1 = 0;

let watchdog = 0; // used to delay showing/hiding video
let faceFound = false;
let faceInitialized = false;

const coverEl = $('#video-cover');
const videoEl = $('#face-stream');
const canvas = document.createElement('canvas');

let net;

window.init = () => {
  colorFrame('white');
  loadText()
    .then(setupPosenet)
    .then(_net => {
      net = _net;
      console.log(net);
      socket.on('emotion:update', updateEmotion);
      socket.emit('emotion:get');
      $('body').on('click', handleClick);
      document.addEventListener('touchmove', (e) => { 
        e.preventDefault(); 
      }, { passive:false });
    });
  // enableAutoTTS();
};


window.loadingComplete = () => {
  if (faceFound) {
    queueText(false);
  }
  $('#hand-container').delay(1000).fadeIn();
};

function loadText() {

  if (window.bilingual) {
    return new Promise(resolve => {
      Papa.parse(i18next.t('01_self.tsv', {lng: window.lang0}), {
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
          phrasesL0 = reordered;
          console.log(phrasesL0, 'REORDERED!');

          if (phrasesL0 && phrasesL1) {
            resolve({phrasesL0, phrasesL1});
          }
        }
      });
      
      // parse second language
      Papa.parse(i18next.t('01_self.tsv', {lng: window.lang1}), {
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
          phrasesL1 = reordered;
          console.log(phrasesL1, 'REORDERED!');

          if (phrasesL0 && phrasesL1) {
            resolve({phrasesL1, phrasesL1});
          }
        }
      });
    });
  } else {
    return new Promise(resolve => {
      Papa.parse(i18next.t('01_self.tsv', {lng: window.lang0}), {
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
          phrasesL0 = reordered;
          console.log(phrasesL0, 'REORDERED!');
          resolve(phrasesL0);
        }
      });
    });
  }

}

function setupPosenet() {
  return new Promise(resolve => {
    posenet.load({
      architecture: 'MobileNetV1',
      outputStride: 16,
      inputResolution: { width: 640, height: 480 },
      multiplier: 0.75
    }).then((net) => {
      resolve(net);
    });
  });
}

function handleClick(e) {
  if (!faceInitialized) {
    setupCamera(e);
  } else {
    queueText(false);
  }
}

async function setupCamera(e) {
  try {
    console.log('connecting user media');
    e.target.disabled = true;
    const stream = await navigator.mediaDevices.getUserMedia({video:true, audio:false});
    console.log('connected user media');
    videoEl[0].srcObject = stream;
    videoEl.on('loadeddata', () => {
      resizeLayout();
      removeCover(true);
      $('#hand-container').remove();
      setupFaceDetection(videoEl[0]);
      faceInitialized = true;
    });
    
  } catch (e) {
    console.log(e);
  }
}

function setupFaceDetection(videoEl) {
  setInterval(() => {
    net.estimateSinglePose(videoEl, {
      flipHorizontal: true
    })
      .then(function(pose) {
        let hip = (pose.keypoints[11].score + pose.keypoints[12].score) / 2;
        if (pose.score > 0.15) {
          watchdog = watchdog < 0 ? 0 : watchdog + 1;
          if (watchdog > (delaySeconds * 10)) {
            faceFound = true;
            removeCover();
          }
        } else {
          watchdog = watchdog > 0 ? 0 : watchdog - 1;
          if (watchdog < -(delaySeconds * 10)) {
            faceFound = false;
            showCover();
          }
        }
      });
  }, 100);
}


function resizeLayout() {
  const currentHeight = $(window).height();
  const heightRatio = currentHeight / ipadHeight;

  // set video dimensions to ipad ratio
  // this is mostly for development and will
  // need some adjustment once we have an ipad 
  // to play with
  let videoWidth;
  let videoHeight;
  if (heightRatio >= 1) {
    videoHeight = ipadHeight;
    videoWidth = ipadWidth;
  } else {
    // adjust canvas to have same ratio as ipad
    videoHeight = currentHeight;
    videoWidth = (ipadWidth / ipadHeight) * currentHeight;
  }

  videoEl.width(videoWidth);
  videoEl.height(videoHeight);
  videoEl.parent().width(videoWidth);
  videoEl.parent().height(videoHeight);

  // set canvas dimensions to match hd incoming dimensions
  // this canvas is only in memory and not on the DOM
  canvas.setAttribute('width', 1280);
  canvas.setAttribute('height', 720);
}



function updateInterface() {
  $('#debug-info').text('CURRENT EMOTION: ' + curEmotion.name + ' (base: ' + curEmotion.base + ', level: ' + curEmotion.level + ')');

  // show loading screen
  cleanupText();
  $('#hand-container').hide();
  showLoadingOverlay(curEmotion);


  ////// CHANGING BACKGROUND COLOR
  let emotion_colors = baseColors[curEmotion.base][curEmotion.level - 1];
  colorView(emotion_colors[0], emotion_colors[1]);
  emotionPhrasesL0 = shuffle(phrasesL0[curEmotion.base]);
  if (window.bilingual) {
    emotionPhrasesL1 = shuffle(phrasesL1[curEmotion.base]);
  }
}

function updateEmotion(msg) {
  console.log('UPDATE EMOTION');
  if (!curEmotion || curEmotion.name !== msg.name) {
    curEmotion = msg;
    console.log('emotion has been updated to: ' + msg.name + ' (base: ' + msg.base + ', level: ' + msg.level + ')');

    updateInterface();
  }
}

function colorView(color0, color1) {
  $('#video-cover').css('background-color', color0);
  if (color1) $('.filtered').css('background', `radial-gradient(${color0},${color1})`);
}

function colorFrame(color0) {
  $('.textbox').css('color', color0);
  $('.md').css('background-color', color0);
  $('.mdiv').css('background-color', color0);
  $('.text-container').css('border-color', color0);
}



function removeCover(loadCam) {
  let emotion_colors = baseColors[curEmotion.base][curEmotion.level - 1];
  colorFrame(emotion_colors[0]);
  coverEl.hide();
  if (spellOut === false && !loadCam) {
    spellOut = true;
    console.log('flip spell out switch');
    queueText(false);
  }
}

function showCover() {
  console.log('show cover');
  colorFrame('white');
  coverEl.show();

  if (spellOut === true) {
    spellOut = false;
    console.log('switch off');
    cleanupText();
  }
}

function cleanupText() {
  $('#dummy').empty();
  $('#spellbox').empty();
  if (phraseTimeout) clearTimeout(phraseTimeout);
  if (typingTimeout) clearTimeout(typingTimeout);

}

function queueText(secondLang) {
  console.log('trying to queue text');
  if (!secondLang) {
    curPhraseL0++;
    if (curPhraseL0 >= emotionPhrasesL0.length) {
      curPhraseL0 = 0;
    }
    if (curPhraseL0 === 0) {
      emotionPhrasesL0 = emotionPhrasesL0.sort(() => Math.random() - 0.5);
    }

    playInstruction(emotionPhrasesL0[curPhraseL0]);
    // speak(emotionPhrasesL0[curPhraseL0]);
    secondLang = true;
  } else {
    curPhraseL1++;
    if (curPhraseL1 >= emotionPhrasesL1.length) {
      curPhraseL1 = 0;
    }
    if (curPhraseL1 === 0) {
      emotionPhrasesL1 = emotionPhrasesL1.sort(() => Math.random() - 0.5);
    }

    playInstruction(emotionPhrasesL1[curPhraseL1]);
    // speak(emotionPhrasesL1[curPhraseL0]);
    secondLang = false;
  }

  if (window.bilingual) {
    phraseTimeout = setTimeout(() => queueText(secondLang), phraseInterval);
  } else {
    phraseTimeout = setTimeout(() => queueText(false), phraseInterval);
  }
}

function playInstruction(phrase) {
  cleanupText();
  //the dummy gets the tight font size which we use in typeInstruction
  $('#dummy').text(phrase);
  $('.textbox-dummy').fancyTextFill({
    maxFontSize: 400
  });
  typeInstruction(phrase);
}

function typeInstruction(phrase, iteration) {
  var iteration = iteration || 0;
  let fontSize = $('#dummy').css('font-size');
  $('#spellbox').css('font-size', fontSize);
  // Prevent our code executing if there are no letters left
  if (iteration === phrase.length) {
    return;
  }

  typingTimeout = setTimeout(function() {
    // Set the instruction to the current text + the next character
    // whilst incrementing the iteration variable
    $('#spellbox').text($('#spellbox').text() + phrase[iteration++]);

    // Re-trigger our function
    typeInstruction(phrase, iteration);
  }, typingSpeed);
}


const rgba_to_grayscale = (rgba, nrows, ncols) => {
  const gray = new Uint8Array(nrows * ncols);
  for (let r = 0; r < nrows; ++r) {
    for (let c = 0; c < ncols; ++c) {
      gray[r * ncols + c] = (2 * rgba[r * 4 * ncols + 4 * c + 0] + 7 * rgba[r * 4 * ncols + 4 * c + 1] + 1 * rgba[r * 4 * ncols + 4 * c + 2]) / 10;
    }
  }
  return gray;
};

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;
  while (0 !== currentIndex) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array;
}
