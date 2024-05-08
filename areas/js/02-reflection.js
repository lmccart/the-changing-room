
// style and js imports
import $ from 'jquery';
import Papa from 'papaparse';
import seedrandom from 'seedrandom';
import '../css/02-reflection.scss';
import './shared.js';
import Timeline from './lib/Timeline.js';
import { getImgUrls, addSvgFilterForElement, getTextColorForBackground } from './lib/imageColorUtils.js';
import i18next from 'i18next';

let curEmotion;
let primaryColors;
let backgroundTextColor;

let timeline;
let imgURLs = [];
let thisScreenParams;
let sharedSeed = 0;
let emotionChanged = false;
let skipToMemories = false;

let dataMeditations = {};
let dataMeditationEmotions = {};
let dataMemories = {};

let speech;

// 10s before meditation
// 10s per instruction
// 15s per long instruction
// total dur 6 minutes (plenty of time)

///////////////////////////////////////////////
//// Screen parameters

const screenParams = {
  0: { id: 0, name: 'LEFT', width: 1920, height: 1080, display: 'left projector'},
  1: { id: 1, name: 'CENTER', width: 1920, height: 1080, display: 'center projector' },
  2: { id: 2, name: 'RIGHT', width: 1920, height: 1080, display: 'right projector' },
  999: { id: 999, name: 'FULLSCREEN', width: 0, height: 1080, display: 'fullscreen' },
};
screenParams[999].width = screenParams[0].width + screenParams[1].width + screenParams[2].width;


let urlParams = new URLSearchParams(window.location.search);
let screenNumber = Number(urlParams.get('screen'));
document.title = '02 reflection: screen ' + screenNumber;

////////////// MEDITATION TIMINGS /////////////

// We pause before meditation starts,
let meditations_fadein_pause = 4000; // should be same as meditation_interval to match sound

// and slowly, the meditation fades in.
let meditations_fadein_duration = 500; 

//////// The meditation starts.

// Each meditation text plays at this interval,
let meditation_interval = 10000;

// and fades in,
let each_meditation_fadein_duration = 500;

// and fades out.
let each_meditation_fadeout_duration = 500;

// (But for [BODY AREA] and [PERSON], at indices 6 and 12 in the text,
let meditation_long_indices = [6, 12];
// there are longer intervals, and we take our time.)
let meditation_long_interval = 15000;


//////// The meditation is over.

// We have a brief pause, 
let meditations_fadeout_pause = 3000;

// Then meditation fades out,
let meditations_fadeout_duration = 500;

// and we pause.
let memories_fadein_pause = 1000;

// Then, memories fade in.
let memories_fadein_duration = 500;

//////// The memory sequence starts.

// Each memory arrives at this interval,
let num_memories = 20;

let memory_interval = 2500;

// and fades in
let each_memory_fadein_duration = 500;

// pauses
let each_memory_pause_duration = 15000;

// and fades out.
let each_memory_fadeout_duration = 300;

/////// The memories are over.

// We pause before memory fades out
let memories_fadeout_pause = 1000;

// All memories fade out, slowly.
let memories_fadeout_duration = 1000;

// Finally,
// we pause before we end the timeline
let timeline_end_pause = 0;



window.soundType = 'mute'; // uses speech synthesis!
window.init = () => {
  setupSynthesis();
  setScreen();
  loadDataAsync(() => {
    socket.on('emotion:update', updateEmotionCurried(() => {
      if (thisScreenParams.id === 0) {
        window.speechSynthesis.cancel();
      }
      if (thisScreenParams.id === 0 || thisScreenParams.id === 999) { 
        setTimeout(() => {
          socket.emit('reflection:end');
        }, 250);
      }
    }));

    socket.on('reflection:restart', (msg) => {
      sharedSeed = msg.seed;
      switchLanguage();
      resetTimeline(); 
      timeline.start();
      console.log('REFLECTION RESTARTED');
    });

    socket.emit('emotion:get'); 
    console.log('loaded');
  });

  $(document).on('keypress', handleKey);
};


function updateEmotionCurried(callback) {
  return function(msg) {
    if (!curEmotion || curEmotion.name !== msg.name) {
      curEmotion = msg;
      emotionChanged = true;
      console.log('emotion has been updated to: ' + curEmotion.name + ' (base: ' + curEmotion.base + ', level: ' + curEmotion.level + ')');
      
      getImgUrls(curEmotion.base, curEmotion.level)
        .then(images => {
          imgURLs = images;
          updateInterface();
          callback();
        });
    }
  };
}

function updateInterface() {
  $('#debug-info').text('CURRENT EMOTION: ' + curEmotion.name + ' (base: ' + curEmotion.base + ', level: ' + curEmotion.level + ')');
}

function switchLanguage() {
  let rng = seedrandom(sharedSeed);
  let i = (Math.floor(100 * rng() + thisScreenParams.id)) % 2;
  window.lang = window[`lang${i}`];
  speech.lang = window.lang;
  // console.log('SEED ', i, ' LANG ', window.lang);
}

///////////////////////////
// DATA AND PARAMS
//////////////////////////

function handleKey(e) {
  if (window.lang0 !== window.lang1 && e.key === 't') {
    switchLanguage();
    // trigger reflection restart on server
    socket.emit('reflection:end');
  }
  if (e.key === '0' | e.key === '1' | e.key === '2') {
    editMode = Number(e.key);
    console.log('editing screen ', editMode);
  } 
  if (editMode > -1) {
    if (e.key === 'l') {
      screenParams[screenNumber].width++;
    } else if (e.key === 'r') {
      screenParams[screenNumber].width--;
    }
    adjustScreen();
  }
}

function setScreen() {
  if (screenNumber < 2) {
    $('#wrapper').addClass('screen-' + screenNumber);
    $('#wrapper').addClass('partialscreen');
  } else {
    $('#wrapper').addClass('fullscreen');
  }
  adjustScreen();
  $('#area-extra').text(screenParams[screenNumber].display);
  console.log('screen set');
}

function adjustScreen() {
  thisScreenParams = screenParams[screenNumber];
  let w = thisScreenParams.width, h = thisScreenParams.height;
  $('#wrapper').width(w).height(h);
  $('.main').width(w).height(h);
  $('#loading').width(w).height(h);
}

const papaPromise = (file) => new Promise((resolve, reject) => {
  Papa.parse(file, { header: true, download: true, skipEmptyLines: 'greedy', complete: resolve, error: reject });
});

async function loadDataAsync(cb) {
  let file = await i18next.t('02_meditation.txt', {lng: window.lang0});
  // let file = '/static/data/fr/02_meditation_fr.txt';
  let data = await fetch(file);
  let text = await data.text();
  dataMeditations[window.lang0] = text.split(/\r?\n/);
  console.log('loaded meditations ', window.lang0, file);

  file = await i18next.t('02_meditation_emotion_specific.tsv', {lng: window.lang0});
  data = await papaPromise(file);
  dataMeditationEmotions[window.lang0] = reorderEmotionSpecific(data.data);
  console.log('loaded emotion specific ', window.lang0, file);

  file = await i18next.t('02_memories.tsv', {lng: window.lang0});
  data = await papaPromise(file);
  dataMemories[window.lang0] = reorderMemories(data.data);
  console.log('loaded memories ', window.lang0, file);

  if (window.lang0 !== window.lang1) {
    file = await i18next.t('02_meditation.txt', {lng: window.lang1});
    data = await fetch(file);
    text = await data.text();
    dataMeditations[window.lang1] = text.split(/\r?\n/);
    console.log('loaded meditations ', window.lang1, file);

    file = await i18next.t('02_meditation_emotion_specific.tsv', {lng: window.lang1});
    data = await papaPromise(file);
    dataMeditationEmotions[window.lang1] = reorderEmotionSpecific(data.data);
    console.log('loaded emotion specific ', window.lang1, file);
  
    file = await i18next.t('02_memories.tsv', {lng: window.lang1});
    // file = '/static/data/en/02_memories_en.tsv';
    data = await papaPromise(file);
    dataMemories[window.lang1] = reorderMemories(data.data);
    console.log('loaded memories ', window.lang1, file);

  }
  cb();
}

function reorderEmotionSpecific(rawResults) {
  const reordered = {};
  for (let i = 0; i < rawResults.length; i++) {
    let thisrow = rawResults[i];
    let newrow = {};
    Object.keys(thisrow).forEach((key) => {
      newrow[key.trim()] = thisrow[key]; 
    });
    reordered[thisrow['EMOTION'].trim()] = newrow;
  }
  return reordered;
}


function reorderMemories(rawResults) {
  const reordered = {};
  for (let i = 0; i < rawResults.length; i++) {
    let thisrow = rawResults[i];
    let newrow = {};
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
  return reordered;
}


/////////////////////////////////
///// BACKGROUNDS
//////////////////////////////////

function setColorsAndBackgrounds() {
  primaryColors = window.baseColors[curEmotion.base][(curEmotion.level - 1) % 3];
  // secondaryColors = window.baseColors[curEmotion.base][curEmotion.level % 3];
  backgroundTextColor = getTextColorForBackground(primaryColors[0]);
  $('#meditation_text').css('color', backgroundTextColor);
  $('#meditation_container').css('border-color', primaryColors[0]);


  // const bg = $('#background');

  const imgUrl = imgURLs[sharedSeed % imgURLs.length];


  $('#memory_container').css('background', `radial-gradient(${primaryColors[0]},${primaryColors[1]})`);
  $('#wrapper').css('background', `radial-gradient(${primaryColors[0]},${primaryColors[1]})`);
  switchBackgrounds([imgUrl], 2000, primaryColors)
    .then(() => {
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
    
    });
}




///////////////////////////////////
//////////// MEDITATIONS
///////////////////////////////////


function generateMeditationTexts() {

  console.log('generateMeditationTexts ', curEmotion.name, window.lang);
  let thisDataMeditationInserts = dataMeditationEmotions[window.lang][curEmotion.name];

  return dataMeditations[window.lang]
    .map((m) => {
      let newm = m;
      for (let k in thisDataMeditationInserts) {
        newm = newm.replace(`[${k}]`, thisDataMeditationInserts[k]);
      }
      newm = newm.replace(curEmotion.name, i18next.t(curEmotion.name, {lng: window.lang})); // translation here, avoid messing up inserts tsv headers
      return newm;
    })
    .filter((m) => {
      return m !== ''; 
    });
}

function displayMeditationPhrase(opts) {
  let parts = opts.text.match(/[^\.!\?]+[\.!\?]+/g);
  let text;
  if (parts.length > 1) {
    // console.log(thisScreenParams.id)
    let id = thisScreenParams.id < 2 ? thisScreenParams.id : 0;
    text = id < parts.length ? parts[id] : parts[0];
  } else {
    text = opts.text;
  }

  let sizeClass = text.length > 80 ? 'smaller_meditation_text' : '';
  $('#meditation_text')
    .fadeOut(opts.fadeOut, function() {
      $(this)
        .text(text)
        .attr('class', sizeClass)
        .fadeIn(opts.fadeIn);
    });
  // speak it
  if (thisScreenParams.id === 0) {
    speech.text = text;
    setTimeout(() => { window.speechSynthesis.speak(speech); }, 2000);
  }
}


///////////////////////////////////
///////////// MEMORIES
///////////////////////////////////

function pickMemoryPairs() {
  let memories = [];
  // console.log(window.lang)
  // console.log(dataMemories['fr'])

  let thisEmotionMemories = seedShuffle(dataMemories[window.lang][curEmotion.base], sharedSeed);

  let rng = seedrandom(sharedSeed);


  for (let i = 0; i < num_memories; i++) {

    let img0 = imgURLs[Math.floor(rng() * imgURLs.length)];
    let img1 = imgURLs[Math.floor(rng() * imgURLs.length)];
    let text = thisEmotionMemories[i % thisEmotionMemories.length];
    let screenN = Math.floor(rng() * 2);

    let thisMempair = [];

    thisMempair.push({
      type: 'image',
      url: img0,
      screenNumber: screenN,
      mempairNumber: i,
    });

    if (rng() < 0.5) {
      thisMempair.push({ 
        type: 'text',
        text: text,
        screenNumber: screenN,
        mempairNumber: i,
      });
    } else {
      thisMempair.push({
        type: 'image',
        url: img1,
        screenNumber: screenN,
        mempairNumber: i,
      });
    }
    memories.push({ data: thisMempair });
  }
  return memories;
}


async function loadMempair(mempair, index) {
  if (!mempair.display) { return mempair; }

  let contrast = Math.random() > 0.5 ? primaryColors[0] : primaryColors[1];
  await loadMedia(mempair.data[0], index, 0, contrast);
  await loadMedia(mempair.data[1], index, 1, contrast);
}


function loadMedia(memory, index, i, contrast) {
  return new Promise(resolve => {
    let memdiv;
    if (memory.type === 'text') {
      memdiv = $('<div></div>');
      memdiv.addClass('text');
      memdiv.text(memory.text);
    }
    else if (memory.type === 'image') {
      memdiv = $('<img></img>');
      memdiv.addClass('image');
      memdiv.attr('src', memory.url);
      let svgId = addSvgFilterForElement(memdiv, ['#000000', contrast]);
      memdiv.data('svgId', svgId);
    } 

    memory.id = `memory-${index}-${i}`;
    memdiv.addClass('memory');
    memdiv.attr('id', memory.id);
    memdiv.css('box-shadow', '0 0 30px gray');
    memdiv.hide();
    memdiv.appendTo('#memory_container');

    if (memory.type === 'text') {
      memory.width = 500;
      memdiv.width(memory.width);
      memory.height = memdiv.height();
      resolve(memdiv);
    } else if (memory.type === 'image') {
      memdiv.on('load', () => {
        memory.naturalWidth = memdiv.get(0).naturalWidth;
        memory.naturalHeight = memdiv.get(0).naturalHeight;
        if (memory.naturalWidth / memory.naturalHeight > 0.75) {
          memory.width = randomBetween(300, 600); // IMAGE SIZE PARAMETERS
        } else {
          memory.width = randomBetween(200, 300); 
        }
        memory.height = memory.naturalHeight * (memory.width / memory.naturalWidth);
        memdiv.width(memory.width);
        memdiv.height(memory.height);
        resolve(memdiv);
      });
    }
  });
}



function positionMempair(mempair, index) {
  if (!mempair.display) { return mempair; }

  let minoverlap = 0.7;
  let maxoverlap = 1.1;
  let memoryPadding = 50; // memory padding in pixels - will add padding around which memories won't be placed


  // first let's assume that the first div is at 0, 0
  let m1 = { 
    x: 0, 
    y: 0, 
    height: mempair.data[0].height,
    width: mempair.data[0].width
  }; 

  let m2 = {
    x: 0,
    y: 0,
    height: mempair.data[1].height,
    width: mempair.data[1].width
  }; //m2 locations based on trig

  let overlapcoeff = randomBetween(minoverlap, maxoverlap);

  // either:
  let sr = Math.random();
  if (sr <= 1) {
    // m2 is on right side of m1, slid up and down
    m2.x = m1.width * overlapcoeff;
    m2.y = randomBetween(m1.y - m2.height, m1.y + m1.height); 
  } else if (sr <= 0.5) {
    // m2 is on left side of m1, slid up and down
    m2.x = -m2.width * overlapcoeff;
    m2.y = randomBetween(m1.y - m2.height, m1.y + m1.height);
  } else if (sr <= 0.75) {
    // m2 is on bottom side of m1, slid left and right
  
    m2.x = randomBetween(m1.x - m2.width, m1.x + m1.width);
  } else {
    // m2 is on top side of m1, slid left and right
    m2.y = -m2.height * overlapcoeff;
    m2.x = randomBetween(m1.x - m2.width, m1.x + m1.width);
  }
  
  // adjust coordinates so that none are negative
  if (m2.x < 0) { 
    m1.x += Math.abs(m2.x);
    m2.x = 0;
  }

  if (m2.y < 0) { 
    m1.y += Math.abs(m2.y);
    m2.y = 0;
  }


  //////////////////

  // get boundingbox of both overlapping rectangles

  // adjust so not taller than screen
  let bb = getBoundingBox(m1, m2);
  if (bb.height > thisScreenParams.height - 2 * memoryPadding) {
    m2.y = m1.y + (Math.random() * 200);
    bb = getBoundingBox(m1, m2);
  }

  // SO now we position the bounding box randomly within the screen
  bb.screenX = randomBetween(memoryPadding, thisScreenParams.width - bb.width - memoryPadding);
  bb.screenY = randomBetween(memoryPadding, thisScreenParams.height - bb.height - memoryPadding);

  // and then drive memdiv screen locations from that
  mempair.data[0].screenX = m1.screenX = m1.x - bb.x1 + bb.screenX;
  mempair.data[0].screenY = m1.screenY = m1.y - bb.y1 + bb.screenY;
  mempair.data[1].screenX = m2.screenX = m2.x - bb.x1 + bb.screenX;
  mempair.data[1].screenY = m2.screenY = m2.y - bb.y1 + bb.screenY;

  $('#' + mempair.data[0].id).css({ top: mempair.data[0].screenY, left: mempair.data[0].screenX, 'z-index': 2 * index });
  $('#' + mempair.data[1].id).css({ top: mempair.data[1].screenY, left: mempair.data[1].screenX, 'z-index': 2 * index + 1 });

  mempair.bb = bb;

  return mempair;
}

function getBoundingBox(m1, m2) {
  let bb = {};
  bb.x1 = Math.min(m1.x, m2.x); 
  bb.y1 = Math.min(m1.y, m2.y); 
  bb.x2 = Math.max(m1.x + m1.width, m2.x + m2.width); 
  bb.y2 = Math.max(m1.y + m1.height, m2.y + m2.height); 
  bb.width = bb.x2 - bb.x1;
  bb.height = bb.y2 - bb.y1;
  return bb;
}


async function generateAndPreloadMemoryPairs() {
  return new Promise(resolve => {

    let memoryPairs = pickMemoryPairs();

    // flag whether or not memory pair is displayed
    memoryPairs.forEach(mempair => {
      if (mempair.data[0].screenNumber === thisScreenParams.id || thisScreenParams.name === 'FULLSCREEN') {
        mempair.display = true;
      } else {
        mempair.display = false;
      }
    });

    let tasks = [];
    memoryPairs.forEach((mempair, index) => {
      tasks.push(loadMempair(mempair, index));
    });

    Promise.all(tasks)
      .then(results => {
        memoryPairs = memoryPairs.map(positionMempair);
        resolve(memoryPairs);
      });

  });

}



function displayMemoryPair(mempair) {
  //{ data: [mem, mem], top: ~, left: ~, fadeIn: 100, fadeOut: 100 };
  // mem looks like: { id: '#memory-0-1', ... }

  mempair.data.forEach(mem => {
    $('#' + mem.id).fadeIn(each_memory_fadein_duration).delay(each_memory_pause_duration + Math.random() * 3000).fadeOut(each_memory_fadeout_duration * 0.5);
  });

}


/////////////////////////////////
///////// Crafting Timeline
/////////////////////////////////

function resetHTML(cb) {
  setColorsAndBackgrounds();
  $('#meditation_text').empty();
  // $('#memory_container').empty();
  $('#memory_container').children().each((i, elt) => {
    let svgId = $(elt).data('svgId');
    $(`#${svgId}`).remove();
    $(elt).remove();
  });
  $('#memory_container').css('opacity', 0);
}



async function queueEvents(timeline) {
  window.timeline = timeline;


  let timeMarker = 0;

  if (!skipToMemories) {
    /////// MEDITATIONS FADE IN
    timeMarker += meditations_fadein_pause;
    timeline.add({ time: timeMarker, event: function() { 
      $('#meditation_container').fadeIn(meditations_fadein_duration);
      console.log('TIMELINE STARTING');
    } });

    /////// QUEUE MEDITATIONS
  
    let mts = generateMeditationTexts();
    let ind = sharedSeed + 1;
    mts.forEach((mt, i) => {
      timeline.add({ time: timeMarker, event: function() { 
        displayMeditationPhrase({ text: mt, fadeIn: each_meditation_fadein_duration, fadeOut: each_meditation_fadeout_duration});
        if (i % 2 === 0) {
          let imgUrl = imgURLs[ind % imgURLs.length];
          switchBackgrounds([imgUrl], 15000, primaryColors);
          ind++;
        }
      } });

      if (meditation_long_indices.includes(i)) {
        timeMarker += meditation_long_interval; 
      } else {
        timeMarker += meditation_interval; 
      }

    });

    /////// MEDITATION FADES OUT

    timeMarker += meditations_fadeout_pause;
    timeline.add({ time: timeMarker, event: function() { 
      $('#meditation_container').fadeOut(meditations_fadeout_duration);
    } });
  }

  // timeMarker += memories_fadein_pause;
  timeline.add({ time: timeMarker, event: function() { 
    $('#memory_container').fadeTo(memories_fadein_duration, 1);
  } });


  ///////// QUEUE MEMORIES

  let mempairs = await generateAndPreloadMemoryPairs();

  mempairs.forEach((mempair, i) => {
    timeline.add({ time: timeMarker, event: function() { 
      if (mempair.data[0].screenNumber === thisScreenParams.id || thisScreenParams.name === 'FULLSCREEN') {
      //only display if we're on the right screen
        displayMemoryPair(mempair);
        console.log('...WE are displaying memory pair #', i, '...');
      } else {
        console.log('...SCREEN ', mempair.data[0].screenNumber, ' is displaying memory pair #', i, '...');
      }
    } }); 
    if (i < 2) {
      timeMarker += memory_interval * 0.5;
    } else {
      timeMarker += memory_interval;
    }
  });
 
  
  timeMarker += memories_fadeout_pause;

  timeline.add({ time: timeMarker, event: function() { 
    $('#meditation_text').empty();
    $('#memory_container').fadeTo(memories_fadeout_duration, 0, () => {
      $(this).children().each((i, elt) => {
        let svgId = $(elt).data('svgId');
        $(`#${svgId}`).remove();
        $(elt).remove();
      });
    });
  } });

  timeMarker += timeline_end_pause;

  if (emotionChanged) {
    let overlay_dur = showLoadingOverlay(curEmotion)[1];
    timeMarker += overlay_dur;
    emotionChanged = false;
  }

  timeline.add({ time: timeMarker, event: function() { 
    if (thisScreenParams.id === 0 || thisScreenParams.id === 999) { 
      socket.emit('reflection:end');
    }
  } });


  timeline.setDuration(timeMarker); 

  console.log('TOTAL TIMELINE DURATION = ' + timeline.duration);

}


function resetTimeline() {  

  console.log('Resetting timeline');

  if (timeline) timeline.clear();
  timeline = new Timeline({ loop: false, duration: 50000, interval: 100 }); 

  resetHTML();

  queueEvents(timeline);

}

///////////////////////////////////
//// HELPERS
/////////////////////////////////////

function seedShuffle(array, seed) { 
  const rng = seedrandom(seed);
  let m = array.length, t, i;
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

function randomBetween(a, b) {
  return a + (Math.random() * (b - a));
}

function setupSynthesis() {
  window.speechSynthesis.onvoiceschanged = function() {
    const voices = window.speechSynthesis.getVoices();
    // console.log(voices);
  };
  speech = new SpeechSynthesisUtterance();
  speech.lang = window.lang; // PEND: could be updated to do opposite language
  speech.rate = 0.85;
  // speech.voice = ??
}
