// style and js imports
import $ from 'jquery';
import '../css/01-faces.scss';
import './shared.js';
import { camvas } from './lib/camvas.js';
import { pico } from './lib/pico.js';
import 'fancy-textfill/es2015/jquery.plugin';




// EMOTION HANDLING
let emotions;
let curEmotion;
const socket = io();

socket.on('emotion:update', updateEmotion);

function updateEmotion(msg) {
  if (!curEmotion || curEmotion.name !== msg.name) {
    curEmotion = msg;
    console.log('emotion has been updated to: ' + msg.name + ' (base: ' + msg.base + ', level: ' + msg.level + ')');

    showLoadingOverlay(curEmotion.name);
    $(".text-container").css("visibility", "hidden");
    updateInterface();
  }
}

function updateInterface() {
  $('#debug-info').text('CURRENT EMOTION: ' + curEmotion.name + ' (base: ' + curEmotion.base + ', level: ' + curEmotion.level + ')')

  // resize font-size dynamically based on how much text
  $('.textbox').fancyTextFill({
    maxFontSize: 400
  });
}

// VIDEO AND FACE HANDLING

// VARIABLES
const canvas = document.createElement('canvas');
const cascadeurl = '/static/facefinder_cascade.txt';
const coverEl = $("#video-cover");
const ctx = canvas.getContext('2d');
const currentWidth = $(window).width();
const currentHeight = $(window).height();
const delaySeconds = 1; // seconds to wait before showing/hiding video
const ipadWidth = 1620;
const ipadHeight = 2160;
const heightRatio = currentHeight / ipadHeight;
const update_memory = pico.instantiate_detection_memory(5); // use the detecions of the last 5 frames
const videoEl = $('#face-stream');
const videoParentEl = $("#video-parent");

let facefinderClassifyRegion;
let videoWidth;
let videoHeight;
let watchdog = 0; // used to delay showing/hiding video

// set video dimensions to ipad ratio
// this is mostly for development and will
// need some adjustment once we have an ipad 
// to play with
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
fetch(cascadeurl).then(function (response) {
  response.arrayBuffer().then(function (buffer) {
    const bytes = new Int8Array(buffer);
    facefinderClassifyRegion = pico.unpack_cascade(bytes);
    console.log('* cascade loaded');
  })
})

// Load webcam and instantiate camvas script
if (navigator.mediaDevices.getUserMedia) {
  navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } })
    .then(function (stream) {
      videoEl[0].srcObject = stream;
      new camvas(ctx, processfn, stream, 10); // 10 here is the target fps for checking for faces
    })
    .catch(function (err) {
      console.log("Error:", err);
    });
}


const rgba_to_grayscale = (rgba, nrows, ncols) => {
  const gray = new Uint8Array(nrows * ncols);
  for (let r = 0; r < nrows; ++r)
    for (let c = 0; c < ncols; ++c)
      gray[r * ncols + c] = (2 * rgba[r * 4 * ncols + 4 * c + 0] + 7 * rgba[r * 4 * ncols + 4 * c + 1] + 1 * rgba[r * 4 * ncols + 4 * c + 2]) / 10;
  return gray;
}

// This function is called by camvas at 10 fps
const processfn = (video) => {
  ctx.drawImage(video, 0, 0);
  var rgba = ctx.getImageData(0, 0, 1280, 720).data;
  const image = {
    "pixels": rgba_to_grayscale(rgba, 720, 1280),
    "nrows": 720,
    "ncols": 1280,
    "ldim": 1280
  }
  const params = {
    "shiftfactor": 0.1, // move the detection window by 10% of its size
    "minsize": 100,     // minimum size of a face
    "maxsize": 1000,    // maximum size of a face
    "scalefactor": 1.1  // for multiscale processing: resize the detection window by 10% when moving to the higher scale
  }
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
      faceFound = true
    }
  }

  // if watchdog is > 20 that means a face has been detected for 2 seconds
  if (faceFound) {
    watchdog = watchdog < 0 ? 0 : watchdog + 1;

    if (watchdog > (delaySeconds * 10)) {
      // remove cover
      
      coverEl.hide();
      $(".text-container").css("visibility", "visible");
    }
  } else {
    watchdog = watchdog > 0 ? 0 : watchdog - 1;

    if (watchdog < -(delaySeconds * 10)) {
      // cover
      coverEl.show();
      $(".text-container").css("visibility", "hidden");

    }
  }
}
