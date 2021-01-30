/* eslint-disable */

// style and js imports
import $ from 'jquery';
import Papa from 'papaparse';
import seedrandom from 'seedrandom';
import '../css/02-reflection.scss';
import './shared.js';
import Timeline from './Timeline.js';
import { getImgUrls, addSvgFilterForElement, getTextColorForBackground } from './lib/imageColorUtils.js';
import './02-reflection-helpers.js';

let emotions;
let curEmotion;
let backgroundColor;
let backgroundTextColor;
let memoriesColor;

var dataMeditations;
var dataMeditationEmotions;
var dataMemories;
var timeline;
var imgURLs = [];
var preloadedImages = []; // kept here to preload images; without this, some browsers might clear cache & unload images
var thisScreenParams;
var sharedSeed = 0;


///////////////////////////////////////////////
//// Screen parameters

var screenParams = {
  0: { id: 0, name: 'LEFT', width: 1631, height: 1080 },
  1: { id: 1, name: 'CENTER', width: 1768, height: 1080 },
  2: { id: 2, name: 'RIGHT', width: 1700, height: 1080 },
  999: { id: 999, name: 'FULLSCREEN', width: 1631 + 1768 + 1700, height: 1080 },
};


////////////// MEDITATION TIMINGS /////////////


// The timeline starts.

// We pause for the loading overlay.
let loading_overlay_pause = 1000; 

// We pause before meditation starts,
let meditations_fadein_pause = 1000; 

// and slowly, the meditation fades in.
let meditations_fadein_duration = 500; 

//////// The meditation starts.

// Each meditation text plays at this interval,
let meditation_interval = 5000;

// and fades in,
let each_meditation_fadein_duration = 500;

// and fades out.
let each_meditation_fadeout_duration = 500;

// (But for [BODY AREA] and [PERSON], at indices 6 and 12 in the text,
let meditation_long_indices = [6, 12];
// there are longer intervals, and we take our time.)
let meditation_long_interval = 10000;


//////// The meditation is over.

// We have a brief pause, 
let meditations_fadeout_pause = 1000;

// Then meditation fades out,
let meditations_fadeout_duration = 500;

// and we pause.
let memories_fadein_pause = 1000;

// Then, memories fade in.
let memories_fadein_duration = 500;

//////// The memory sequence starts.

// Each memory arrives at this interval,
let memory_interval = 1000;

// and fades in
let each_memory_fadein_duration = 500;

// pauses
let each_memory_pause_duration = 2000;

// and fades out.
let each_memory_fadeout_duration = 500;

/////// The memories are over.

// We pause before memory fades out
let memories_fadeout_pause = 1000;

// All memories fade out, slowly.
let memories_fadeout_duration = 1000;

// Finally,
// we pause before we end the timeline
let timeline_end_pause = 3000;

// and then we start it 
// all
// over 
// again.



///////////////////////////////////////////////
///* DEV TIMINGS
meditation_long_interval = 1000;
meditation_interval = 500;
each_meditation_fadeout_duration = 50;
//  */


window.init = () => {


  setScreen();

  loadData(() => {

    console.log('Data loaded!');

    socket.on('emotion:update', updateEmotionCurried(() => {
      if (timeline === undefined) {
        // on launch/startup
        resetTimeline(); 
        timeline.start();
      }
    }));

    socket.on('reflection:restart', (msg) => {

      sharedSeed = JSON.parse(msg).seed;
      console.log('shared seed = ', sharedSeed);

      resetTimeline(); 
      timeline.start();
      console.log('REFLECTION RESTARTED');
    });

    socket.emit('emotion:get');
  });
};


function updateEmotionCurried(callback) {
  return function(msg) {
    if (!curEmotion || curEmotion.name !== msg.name) {
      curEmotion = msg;
      console.log('emotion has been updated to: ' + msg.name + ' (base: ' + msg.base + ', level: ' + msg.level + ')');
      updateImageList(() => {
        updateInterface();
        callback();
      });
    }
  };
}

function updateInterface() {
  $('#debug-info').text('CURRENT EMOTION: ' + curEmotion.name + ' (base: ' + curEmotion.base + ', level: ' + curEmotion.level + ')');
}


///////////////////////////


function setScreen() {
  let urlParams = new URLSearchParams(window.location.search);
  let screenNumber = urlParams.get('screen');
  if (screenNumber) {
    $('body').addClass('screen-' + screenNumber);
    $('body').addClass('partialscreen');
    thisScreenParams = screenParams[screenNumber];
    $('body').width(thisScreenParams.width).height(thisScreenParams.height);
    $('.main').width(thisScreenParams.width).height(thisScreenParams.height);
    $('#loading').width(thisScreenParams.width).height(thisScreenParams.height);
  } else {
    $('body').addClass('fullscreen');
  }

}

function updateImageList(cb) {

  getImgUrls(curEmotion.base)
    .then(images => { 

      imgURLs = images;

      preloadedImages = [];
      imgURLs.forEach(url => {
        let img = new Image();
        img.src = url;
        preloadedImages.push(img);
      });
      cb(imgURLs);
    });
}

function loadData(cb) {
  var dataLoaded = -3; // this is a bit hacky but simpler than Promises.all

  fetch('/static/data/02_meditation.txt')
    .then(res => res.blob())
    .then(blob => blob.text())
    .then(text => {
      dataMeditations = text.split(/\r?\n/);
      dataLoaded += 1;
      if (dataLoaded === 0) {
        cb(); 
      } 
    });


  Papa.parse('/static/data/02_meditation_emotion_specific.tsv', {
    download: true,
    header: true,
    skipEmptyLines: 'greedy',
    complete: function(results) {
      const rawResults = results.data;
      // the data comes in as [{ 'EMOTION': 'annoyed', ' BODY AREA': 'Feel that...', ...} ...]
      // I (dan) think it should be { 'annoyed': { 'BODY AREA': 'string, 'PERSON': 'string' } ... }
      console.log(rawResults);
      const reordered = {};

      for (var i = 0; i < rawResults.length; i++) {
        let thisrow = rawResults[i];

        var newrow = {};
        Object.keys(thisrow).forEach((key) => {
          newrow[key.trim()] = thisrow[key]; 
        });

        reordered[thisrow['EMOTION'].trim()] = newrow;
      }
      dataMeditationEmotions = reordered;
      dataLoaded += 1;
      if (dataLoaded === 0) {
        cb(); 
      } 
    }
  });


  Papa.parse('/static/data/02_memories.tsv', {
    download: true,
    header: true,
    skipEmptyLines: 'greedy',
    complete: function(results) {
      const rawResults = results.data;
      // the data comes in as [{ 'afraid': 'One time this..', 'alive': 'one day...', ...} ...]
      // I (dan) think it should be { 'annoyed': [ 'One time', ...], 'alive': ['one day', ..] /// 
      const reordered = {};

      for (var i = 0; i < rawResults.length; i++) {
        let thisrow = rawResults[i];

        var newrow = {};
        Object.keys(thisrow).forEach((key) => { 
          key = key.trim();
          if (key !== '' && thisrow[key].trim() !== '') {
            if (!reordered[key]) {
              reordered[key] = []; 
            } 
            reordered[key].push(thisrow[key]);
          }
        });
      }
      dataMemories = reordered;
      dataLoaded += 1;
      if (dataLoaded === 0) {
        cb(); 
      } 
    }
  });


}


//////////////////////




function generateMeditationTexts() {

  let thisDataMeditationInserts = dataMeditationEmotions[curEmotion.name];

  return dataMeditations
    .map((m) => {
      let newm = m;
      for (let k in thisDataMeditationInserts) {
        newm = newm.replace(`[${k}]`, thisDataMeditationInserts[k]); 
      }
      
      return newm;
    })
    .filter((m) => {
      return m !== ''; 
    });
}

function seedShuffle(array, seed) { 

  const rng = seedrandom(seed);

  var m = array.length, t, i;

  // While there remain elements to shuffle…
  while (m) {

    // Pick a remaining element…
    i = Math.floor(rng() * m--);

    // And swap it with the current element.
    t = array[m];
    array[m] = array[i];
    array[i] = t;
  }

  return array;
}

function generateMemoryPairs() {
 
  var memories = [];

  var thisEmotionMemories = seedShuffle(dataMemories[curEmotion.base], sharedSeed);

  let rng = seedrandom(sharedSeed);

  let screenNumber;

  let imgCounter = 0;
  let memCounter = 0;
  let mempairCounter = 0;

  
  while (imgCounter < imgURLs.length) {

    // randomly pick screen
    let r = rng();
    if (r < 0.333) { 
      screenNumber = 0;
    } else if (r < 0.666) {
      screenNumber = 1;
    } else {
      screenNumber = 2;
    }

    var thisMemPair = [];

    thisMemPair.push({
      type: 'image',
      url: imgURLs[imgCounter++],
      screenNumber: screenNumber,
      mempairNumber: mempairCounter,
    });

    if (imgCounter < imgURLs.length && memCounter < thisEmotionMemories.length && rng() < 0.5) {
      thisMemPair.push({ 
        type: 'text',
        text: thisEmotionMemories[memCounter++],
        screenNumber: screenNumber,
        mempairNumber: mempairCounter,
      });
    } else {
      thisMemPair.push({
        type: 'image',
        url: imgURLs[imgCounter++],
        screenNumber: screenNumber,
        mempairNumber: mempairCounter,
      });
    }

    mempairCounter++;
    memories.push(thisMemPair);


  }


  return memories;

}

function displayMeditationPhrase(opts) {
  // opts: { text: mt, fadeIn: 100, fadeOut: 100 };
  if (thisScreenParams.id !== 1) { 
    console.log('...displaying meditation on screen 1...');
  }
  $('#meditation_text')
    .fadeOut(opts.fadeOut, function() {
      $(this)
        .text(opts.text)
        .fadeIn(opts.fadeIn);
    });
}

function preloadMempairDivs(mempairdata, index) {

  // generate divs
  let memdivs = mempairdata.map((memory, i) => {

    let memdiv;
   
    if (memory.type === 'text') {
      memdiv = $('<div></div>');
      memdiv.addClass('text');
      memdiv.text(memory.text);
    } 
    if (memory.type === 'image') {
      memdiv = $('<img></img>');
      memdiv.addClass('image');
      memdiv.attr('src', memory.url);
      let svgId = addSvgFilterForElement(memdiv, memoriesColor);
    } 

    memdiv.addClass('memory');
    memdiv.attr('id', `memory-${index}-${i}`);
    return memdiv;
  });

  // add them to container
  memdivs.forEach(m => {
    m.hide().appendTo('#memory_container');
  });

  // generate the locations
  //
  console.log(memdivs);
  console.log(memdivs[0].width());
  let memlocs = generateMemoryLocations(memdivs);

  console.log(memlocs);

  // position via css
  memdivs[0].css({ top: memlocs.m1.screenY, left: memlocs.m1.screenX });
  memdivs[1].css({ top: memlocs.m2.screenY, left: memlocs.m2.screenX });

  return memdivs;

}


function generateMemoryLocations(memdivs) {

  let minoverlap = 0.7;
  let maxoverlap = 1.2;
  let memoryPadding = 30; // memory padding in pixels - will add padding around which memories won't be placed


  // first let's assume that the first div is at 0, 0
  let m1 = { 
    x: 0, 
    y: 0, 
    height: memdivs[0].height(), 
    width: memdivs[0].width() 
  }; 

  let m2 = {
    height: memdivs[0].height(), 
    width: memdivs[0].width() 
  }; //m2 locations based on trig

  let overlapcoeff = minoverlap + (Math.random() * (maxoverlap - minoverlap));

  let randangle = Math.random() * Math.PI * 2; // random angle in radians

  let possiblem1r1 = Math.abs(m1.height / 2 / Math.sin(randangle));
  let possiblem1r2 = Math.abs(m1.width / 2 / Math.cos(randangle));
  let m1r = Math.min(possiblem1r1, possiblem1r2);  

  let possiblem2r1 = Math.abs(m2.height / 2 / Math.sin(randangle));
  let possiblem2r2 = Math.abs(m2.width / 2 / Math.cos(randangle));
  let m2r = Math.min(possiblem2r1, possiblem2r2);  

  let distapart = (m1r + m2r) * overlapcoeff;


  // set m2 locations with some trig
  m2.x = (Math.cos(randangle) * distapart) + m1.x;
  m2.y = (Math.sin(randangle) * distapart) + m1.y;

  //////////////////


  // adjust coordinates so that none are negative
  if (m2.x < 0) { 
    m1.x += Math.abs(m2.x);
    m2.x = 0;
  }

  if (m2.y < 0) { 
    m1.y += Math.abs(m2.y);
    m2.y = 0;
  }

  // get boundingbox of both overlapping rectangles
  let bb = {};
  bb.x1 = Math.min(m1.x, m2.x); 
  bb.y1 = Math.min(m1.y, m2.y); 
  bb.x2 = Math.max(m1.x + m1.width, m2.x + m2.width); 
  bb.y2 = Math.max(m1.y + m1.height, m2.y + m2.height); 
  bb.width = bb.x2 - bb.x1;
  bb.height = bb.y2 - bb.y1;


  // SO now we position the bounding box randomly within the screen
  bb.screenX = Math.random() * (thisScreenParams.width - bb.width - (memoryPadding * 2));
  bb.screenY = Math.random() * (thisScreenParams.height - bb.height - (memoryPadding * 2));


  // and then drive memdiv screen locations from that
  m1.screenX = m1.x + bb.screenX;
  m1.screenY = m1.y + bb.screenY;
  m2.screenX = m2.x + bb.screenX;
  m2.screenY = m2.y + bb.screenY;

  return {
    m1: m1,
    m2: m2,
    bb: bb,
    randangle: randangle,
    distapart: distapart
  };

}


function displayMemoryPair(opts) {
  //{ data: [mem, mem], top: ~, left: ~, fadeIn: 100, fadeOut: 100 };
  let mempairdata = opts.data;


  memdivs[0]
    .fadeIn(opts.fadeIn);
  memdivs[1]
    .fadeIn(opts.fadeIn);


}


function setColorsAndBackgrounds() {
  backgroundColor = window.baseColors[curEmotion.base][curEmotion.level % 3];
  memoriesColor = window.baseColors[curEmotion.base][(curEmotion.level - 1) % 3];
  window.baseColors[curEmotion.base];
  backgroundTextColor = getTextColorForBackground(backgroundColor[0]);
  $('#meditation_text').css('color', backgroundTextColor);
  $('#meditation_container').css('border-color', backgroundTextColor);


  const bg = $('#background');

  const imgUrl = imgURLs[sharedSeed % imgURLs.length];
  let prevSvgId = bg.data('svgId');
  let svgId = addSvgFilterForElement(bg, window.baseColors[curEmotion.base][curEmotion.level % 3]);
  bg.data('svgId', svgId);
  bg.css('background-image', `url(${imgUrl})`);
  $('#loader').attr('src', imgUrl).off();
  $('#loader').attr('src', imgUrl).on('load', function() {

    let nw = $('#loader')[0].naturalWidth;
    let nh = $('#loader')[0].naturalHeight;
    let bgw, bgh, bgscale;
    let bgIsTaller = false;
    if ((nw / nh) > (screenParams[1].width / screenParams[1].height)) {
      // background image is wider than screen, so 
      // it is filled at top and bottom and cropped on the sides
      bgh = screenParams[1].height;
      bgw = bgh * nw / nh;
      bgscale = bgw / nw;
    } else {
      // background image is taller than screen, so 
      // it is filled at left and right and cropped at top and bottom
      bgw = screenParams[1].width;
      bgh = bgw * nh / nw;
      bgscale = bgh / nh;
      bgIsTaller = true;
    }

      
    if (thisScreenParams.id === 0) {
      $('#background').css('background-size', `${bgw}px ${bgh}px`);
      if (bgIsTaller) {
        $('#background').css('background-position', `-${(bgw - screenParams[1].width)}px center`);
      } else {
        $('#background').css('background-position', `calc(0% - ${(bgw - screenParams[1].width) / 2}px) center`);
      }
    }
   
    if (thisScreenParams.id === 2) {
      $('#background').css('background-size', `${bgw}px ${bgh}px`);
      if (bgIsTaller) {
        $('#background').css('background-position', `calc(100% - ${(bgw - screenParams[1].width)}px) center`);
      } else {
        $('#background').css('background-position', `calc(0% - ${(bgw - thisScreenParams.width) / 2}px) center`);
      }
    }
   
    
    setTimeout(() => {
      console.log(`removing #${prevSvgId}`);
      $(`#${prevSvgId}`).remove();
    }, 1000);
  });
}


/////////////////////////////////

function resetHTML(cb) {
  $('svg').remove();
  setColorsAndBackgrounds();
  $('#meditation_text').empty();
  $('#memory_container').empty();
}

function preloadImages(memdata) {

  memdata.forEach((mempair, i) => {
    if (mempair[0].screenNumber === thisScreenParams.id || thisScreenParams.name === 'FULLSCREEN') {
      preloadMempairDivs(mempair, i);
    }
  });



}

function queueEvents(timeline) {
  window.timeline = timeline;



  var timeMarker = 0;




  timeline.add({ time: timeMarker, event: function() { 
    showLoadingOverlay(curEmotion);
  } });

  timeMarker += loading_overlay_pause;

  timeMarker += meditations_fadein_pause;

  console.log(thisScreenParams);


  timeline.add({ time: timeMarker, event: function() { 
    $('#meditation_container').fadeIn(meditations_fadein_duration);
    console.log('TIMELINE STARTING');
  } });




  ///////// QUEUE MEDITATIONS
  /* 
  let mts = generateMeditationTexts();

  mts.forEach((mt, i) => {


    timeline.add({ time: timeMarker, event: function() { 
      displayMeditationPhrase({ text: mt, fadeIn: each_meditation_fadein_duration, fadeOut: each_meditation_fadeout_duration});
    } });

    if (meditation_long_indices.includes(i)) {
      timeMarker += meditation_long_interval; 
    } else {
      timeMarker += meditation_interval; 
    }
    

  });

  ///////// MEDITATION FADES OUT
  //

  timeMarker += meditations_fadeout_pause;

  timeline.add({ time: timeMarker, event: function() { 
    $('#meditation_container').fadeOut(meditations_fadeout_duration);
  } });


  timeMarker += memories_fadein_pause;
  */

  timeline.add({ time: timeMarker, event: function() { 
    $('#memory_container').fadeIn(memories_fadein_duration);
  } });


  ///////// QUEUE MEMORIES
  
  let mempairs = generateMemoryPairs();

  preloadImages(mempairs);

  mempairs.forEach((mempair, i) => {


    timeline.add({ time: timeMarker, event: function() { 


      if (mempair[0].screenNumber === thisScreenParams.id || thisScreenParams.name === 'FULLSCREEN') {
      //only display if we're on the right screen
        
        $(`#memory-${i}-0`).fadeIn(each_memory_fadein_duration);
        $(`#memory-${i}-1`).fadeIn(each_memory_fadein_duration);


        console.log('...WE are displaying memory pair #', i, '...');
      } else {
        console.log('...SOMEONE ELSE is displaying memory pair #', i, '...');
      }


    } });

    timeMarker += memory_interval;

  });
 
  
  timeMarker += memories_fadeout_pause;

  timeline.add({ time: timeMarker, event: function() { 
    $('#meditation_text').empty();
    $('#memory_container').fadeOut(memories_fadeout_duration, function() {
      $(this).empty();
    });
  } });

  timeMarker += timeline_end_pause;

  timeline.add({ time: timeMarker, event: function() { 
    if (thisScreenParams.id === 1) { 
      socket.emit('reflection:end');
    }
  } });

  timeline.setDuration(timeMarker); 


}


function resetTimeline() {  

    console.log('Initializing timeline');
 
    timeline = new Timeline({ loop: false, duration: 50000, interval: 100 }); 

    resetHTML();

    queueEvents(timeline);

}




