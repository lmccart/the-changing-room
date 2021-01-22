// style and js imports
import $ from 'jquery';
import '../css/01-faces.scss';
import './shared.js';
import { camvas } from './lib/camvas.js';
import { pico } from './lib/pico.js';
import 'fancy-textfill/es2015/jquery.plugin';
import { getTextColorForBackground } from './lib/imageColorUtils.js';
// import Timeline from './Timeline.js';
import Papa from 'papaparse';


const cascadeurl = '/static/facefinder_cascade.txt';
const ipadWidth = 1620;
const ipadHeight = 2160;
const typingSpeed = 60;
const delaySeconds = 1; // seconds to wait before showing/hiding video
const update_memory = pico.instantiate_detection_memory(5); // use the detecions of the last 5 frames

let emotions;
let curEmotion;
let emotionalMessage = '';

let facefinderClassifyRegion;
let watchdog = 0; // used to delay showing/hiding video
let spellOut = false; // used to determine when to animate text
// let phraseInterval = 1000;

const coverEl = $('#video-cover');
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');


// let windowInitalized = false;

// console.log('adding updateEmotion listener');
// socket.on('emotion:update', updateEmotionIfLoaded);
// socket.on('emotion:get');



// var updateEmotionIfLoaded = function(msg) {
//   console.log(windowInitalized);
//   if (windowInitalized === true) {
//     console.log('updating emotion!!');
//     updateEmotion(msg);
//   } else {
//     setTimeout(updateEmotionIfLoaded(msg), 1000);
//   }
// };


function setupFaceDetection(options) {


  // we want to use options.onFaceVisible and options.onFaceHidden

  // VIDEO AND FACE HANDLING
  const rgba_to_grayscale = (rgba, nrows, ncols) => {
    const gray = new Uint8Array(nrows * ncols);
    for (let r = 0; r < nrows; ++r) {
      for (let c = 0; c < ncols; ++c) {
        gray[r * ncols + c] = (2 * rgba[r * 4 * ncols + 4 * c + 0] + 7 * rgba[r * 4 * ncols + 4 * c + 1] + 1 * rgba[r * 4 * ncols + 4 * c + 2]) / 10;
      }
    }
    return gray;
  };


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
    dets = pico.cluster_detections(dets, 0.2); // set IoU threshold to 0.2

    let faceFound = false;
    for (let i = 0; i < dets.length; ++i) {
      // check the detection score
      // if it's above the threshold increment watchdog
      // (the constant 50.0 is empirical: other cascades might require a different one)
      if (dets[i][3] > 50.0) {
        faceFound = true;
      }
    }

    // if watchdog is > 20 that means a face has been detected for 2 seconds
    if (faceFound) {
      watchdog = watchdog < 0 ? 0 : watchdog + 1;

      if (watchdog > (delaySeconds * 10)) {
        // remove cover
        options.onFaceVisible();

      }
    } else {
      watchdog = watchdog > 0 ? 0 : watchdog - 1;

      if (watchdog < -(delaySeconds * 10)) {
        // cover

        options.onFaceHidden();

      }
    }
  };



  const currentHeight = $(window).height();
  const heightRatio = currentHeight / ipadHeight;
  const videoEl = $('#face-stream');
  const videoParentEl = $('#video-parent');


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

  videoParentEl.width(videoWidth);
  videoParentEl.height(videoHeight);

  // set canvas dimensions to match hd incoming dimensions
  // this canvas is only in memory and not on the DOM
  canvas.setAttribute('width', 1280);
  canvas.setAttribute('height', 720);


  // face detection code based on https://nenadmarkus.com/p/picojs-intro/demo/

  // setup Pico face detector with cascade data
  fetch(cascadeurl).then(function(response) {
    response.arrayBuffer().then(function(buffer) {
      const bytes = new Int8Array(buffer);
      facefinderClassifyRegion = pico.unpack_cascade(bytes);
      console.log('* cascade loaded');
    });
  });


  // Load webcam and instantiate camvas script
  if (navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } })
      .then(function(stream) {
        videoEl[0].srcObject = stream;
        new camvas(ctx, processfn, stream, 10); // 10 here is the target fps for checking for faces
      })
      .catch(function(err) {
        console.log('Error:', err);
      });
  }
}


function loadText(callback) {
  // /data/01_reflections.tsv
  Papa.parse('/data/01_reflections.tsv', {
    download: true,
    header: true,
    skipEmptyLines: 'greedy',
    complete: function(results) {
      const rawResults = results.data;
      // console.log(rawResults, 'RAW RESULTS');

      const reordered = {};
      const keys = Object.keys(rawResults[0]);
      keys.forEach(key => reordered[key] = []);

      for (var i = 0; i < rawResults.length; i++) {
        const resultRow = rawResults[i];
        keys.forEach(key => resultRow[key].trim().length > 0 && reordered[key].push(resultRow[key]));
      }
      window.phrases = reordered;
      console.log(phrases, 'REORDERED!');
      if (typeof (callback) === 'function') {
        callback(window.phrases);
      }
    }

  });
}



function queueTextsAtInterval(phrases, interval) {
  console.log('WE SHOULD BE QUEUEING UP THESE PHRASES:', phrases, 'at this interval', interval);

  // this is where we queue up texts showing up
}


function updateInterface() {
  $('#debug-info').text('CURRENT EMOTION: ' + curEmotion.name + ' (base: ' + curEmotion.base + ', level: ' + curEmotion.level + ')');



  // show loading screen
  showLoadingOverlay(curEmotion, function() {
    console.log('finished loading');
  });



  ////// CHANGING BACKGROUND COLOR
  let emotion_colors = baseColors[curEmotion.base];
  let emotion_colors_str1 = '#' + emotion_colors[0][0];
  let emotion_colors_str2 = '#' + emotion_colors[0][1];
  // test gradient
  // $('.radial-gradient').css({background:'-webkit-radial-gradient(' + emotion_colors_str1 + ',' + emotion_colors_str2 + ')'});
  $('.filtered').css({ background: '-webkit-radial-gradient(' + emotion_colors_str1 + ',' + emotion_colors_str2 + ')' });
  $('#video-cover').css('background-color', emotion_colors_str1);


  /////// CHANGING PHRASES
  // shuffle phrases
  // cycle through phrases over 60 seconds

  let emotionPhrases = window.phrases[curEmotion.base];
  queueTextsAtInterval(emotionPhrases, 60);





  let randomPhrase = window.phrases[curEmotion.base][Math.floor(Math.random() * window.phrases[curEmotion.base].length)];
  console.log(randomPhrase, 'RANDOM');

  emotionalMessage = randomPhrase;

  console.log(emotionalMessage, ' EMOTIONAL MSG');

  // emotionalMessage = 

  $('#dummy').text(emotionalMessage);
  console.log(emotionalMessage);
  $('.textbox-dummy').fancyTextFill({
    maxFontSize: 400
  });

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



function removeCover() {
  coverEl.hide();
  $('.textbox').css('visibility', 'visible');
  $('#face-stream').css('visibility', 'visible');
  if (spellOut === false) {
    spellOut = true;
    console.log('flip spell out switch');
    typeInstruction(emotionalMessage);
  }
}

function showCover() {
  coverEl.show();
  $('.textbox').css('visibility', 'hidden');
  $('#face-stream').css('visibility', 'hidden');

  if (spellOut === true) {
    spellOut = false;
    console.log('switch off');
    $('#spellbox').empty();
  }
}

function typeInstruction(string, iteration) {
  var iteration = iteration || 0;
  let fontSize = $('#dummy').css('font-size');
  console.log(fontSize);
  $('#spellbox').css('font-size', fontSize);
  // Prevent our code executing if there are no letters left
  if (iteration === string.length) {
    return;
  }

  setTimeout(function() {
    // Set the instruction to the current text + the next character
    // whilst incrementing the iteration variable
    $('#spellbox').text($('#spellbox').text() + string[iteration++]);

    // Re-trigger our function
    typeInstruction(string, iteration);
  }, typingSpeed);
}



////////////////
////////////////
////////////////



window.init = () => {

  // windowInitalized = true;


  loadText(function(t) {

    socket.on('emotion:update', updateEmotion);
    socket.emit('emotion:get');

  });
  // $('#dummy').text(emotionalMessage);
  // console.log(emotionalMessage);
  // $('.textbox-dummy').fancyTextFill({
  //   maxFontSize: 400
  // });

  setupFaceDetection({
    onFaceVisible: function() {
      console.log('Face IS Visible!!!!!!!!');
      removeCover();
    },
    onFaceHidden: function() {
      console.log('Face HIDDDDENNN!!!');
      showCover();
    }
  });

};