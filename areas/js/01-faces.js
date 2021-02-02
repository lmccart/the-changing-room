// style and js imports
import $ from 'jquery';
import '../css/01-faces.scss';
import './shared.js';
import { camvas } from './lib/camvas.js';
import { pico } from './lib/pico.js';
import 'fancy-textfill/es2015/jquery.plugin';
import { getTextColorForBackground } from './lib/imageColorUtils.js';
import Papa from 'papaparse';
const cascadeurl = '/static/facefinder_cascade.txt';

const ipadWidth = 1620;
const ipadHeight = 2160;
const typingSpeed = 60;
let phraseInterval = 5000; 
const delaySeconds = 1; // seconds to wait before showing/hiding video
const update_memory = pico.instantiate_detection_memory(5); // use the detecions of the last 5 frames

let emotions;
let curEmotion;
let emotionalMessage = '';
let spellOut = false; // used to determine when to animate text
let phraseTimeout;
let typingTimeout;
let phrases;
let emotionPhrases;
let curPhrase = 0;

let facefinderClassifyRegion;
let watchdog = 0; // used to delay showing/hiding video
let faceFound = false;
let faceInitialized = false;
let face_threshold = 0.01; // 0.2;

const coverEl = $('#video-cover');
const videoEl = $('#face-stream');
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');


window.init = () => {
  loadText()
    .then(loadClassifier)
    .then(() => {
      socket.on('emotion:update', updateEmotion);
      socket.emit('emotion:get');
      $('body').on('click', setupFaceDetection);
      document.addEventListener('touchmove', (e) => { 
        e.preventDefault(); 
      }, { passive:false });
    });
};

window.loadingComplete = () => {
  if (faceFound) {
    queueText();
  }
  $('#hand-container').delay(1000).fadeIn();
};

async function loadText() {
  await Papa.parse('/static/data/01_reflections.tsv', {
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
      phrases = reordered;
      console.log(phrases, 'REORDERED!');
      return phrases;
    }
  });
}

async function loadClassifier() {
  await fetch(cascadeurl).then(function(response) {
    response.arrayBuffer().then(function(buffer) {
      const bytes = new Int8Array(buffer);
      facefinderClassifyRegion = pico.unpack_cascade(bytes);
      console.log('* cascade loaded');
      return;
    });
  });
}

async function setupFaceDetection(e) {
  if (!faceInitialized) {
    try {
      console.log('connecting user media');
      e.target.disabled = true;
      faceInitialized = true;
      const stream = await navigator.mediaDevices.getUserMedia({video:true, audio:false});
      console.log('connected user media');
      videoEl[0].srcObject = stream;
      new camvas(ctx, processfn, stream, 10); // 10 here is the target fps for checking for faces
      resizeLayout();
      removeCover(true);
      $('#hand-container').remove();
    } catch (e) {
      console.log(e);
    }
  }
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


// This function is called by camvas at 10 fps
const processfn = (video) => {
  ctx.drawImage(video, 0, 0);
  var rgba = ctx.getImageData(0, 0, 1280, 720).data;
  const image = {
    'pixels': rgba_to_grayscale(rgba, 720, 1280),
    'nrows': 720,
    'ncols': 1280,
    'ldim': 1280
  };
  const params = {
    'shiftfactor': 0.1, // move the detection window by 10% of its size
    'minsize': 100, // minimum size of a face
    'maxsize': 1000, // maximum size of a face
    'scalefactor': 1.1 // for multiscale processing: resize the detection window by 10% when moving to the higher scale
  };
  // run the cascade over the frame and cluster the obtained detections
  // dets is an array that contains (r, c, s, q) quadruplets
  // (representing row, column, scale and detection score)
  let dets = pico.run_cascade(image, facefinderClassifyRegion, params);
  dets = update_memory(dets);
  dets = pico.cluster_detections(dets, face_threshold); // set IoU threshold to 0.2

  let faceTempFound = false;
  for (let i = 0; i < dets.length; ++i) {
    // check the detection score
    // if it's above the threshold increment watchdog
    // (the constant 50.0 is empirical: other cascades might require a different one)
    if (dets[i][3] > 5.0) {
      faceTempFound = true;
    } 
  }

  // if watchdog is > 20 that means a face has been detected for 2 seconds
  if (faceTempFound) {
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
};


function updateInterface() {
  $('#debug-info').text('CURRENT EMOTION: ' + curEmotion.name + ' (base: ' + curEmotion.base + ', level: ' + curEmotion.level + ')');

  // show loading screen
  cleanupText();
  $('#hand-container').hide();
  showLoadingOverlay(curEmotion);


  ////// CHANGING BACKGROUND COLOR
  let emotion_colors = baseColors[curEmotion.base][0];

  console.log('setting css');
  $('.filtered').css('background', `radial-gradient(${emotion_colors[0]},${emotion_colors[1]})`);
  $('#video-cover').css('background-color', emotion_colors[1]);


  /////// CHANGING PHRASES
  // shuffle phrases
  // cycle through phrases 

  emotionPhrases = phrases[curEmotion.base];

  $('.textbox').css('visibility', 'hidden');
  $('#face-stream').css('visibility', 'hidden');

}




function updateEmotion(msg) {
  console.log('UPDATE EMOTION');
  if (!curEmotion || curEmotion.name !== msg.name) {
    curEmotion = msg;
    console.log('emotion has been updated to: ' + msg.name + ' (base: ' + msg.base + ', level: ' + msg.level + ')');

    updateInterface();
  }
}



function removeCover(loadCam) {
  coverEl.hide();
  $('.filtered').css('visibility', 'visible');
  $('.textbox').css('visibility', 'visible');
  $('#face-stream').css('visibility', 'visible');
  if (spellOut === false && !loadCam) {
    spellOut = true;
    console.log('flip spell out switch');
    queueText();
  }
}

function showCover() {
  console.log('show cover');
  coverEl.show();
  $('.filtered').css('visibility', 'hidden');
  $('.textbox').css('visibility', 'hidden');
  $('#face-stream').css('visibility', 'hidden');

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

function queueText() {
  curPhrase++;
  if (curPhrase >= emotionPhrases.length) {
    curPhrase = 0;
  }
  if (curPhrase === 0) {
    emotionPhrases = emotionPhrases.sort(() => Math.random() - 0.5);
  }

  playInstruction(emotionPhrases[curPhrase]);
  phraseTimeout = setTimeout(queueText, phraseInterval);
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
