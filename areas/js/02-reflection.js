// style and js imports
import $ from 'jquery';
import Papa from 'papaparse';
import seedrandom from 'seedrandom';
import '../css/02-reflection.scss';
import './shared.js';
import Timeline from './Timeline.js';

let emotions;
let curEmotion;

var dataMeditations;
var dataMeditationEmotions;
var dataMemories;
var timeline;
var imageList = [];
var preloadedImages = []; // kept here to preload images; without this, some browsers might clear cache & unload images
var thisScreenParams;


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
//// Screen parameters

var screenParams = {
  0: { id: 0, name: 'LEFT', width: 1631, height: 1080 },
  1: { id: 1, name: 'CENTER', width: 1768, height: 1080 },
  2: { id: 2, name: 'RIGHT', width: 1700, height: 1080 },
  999: { id: 999, name: 'FULLSCREEN', width: 1631 + 1768 + 1700, height: 1080 },
};

///////////////////////////////////////////////
/* DEV TIMINGS
meditation_long_interval = 1000;
meditation_interval = 500;
each_meditation_fadeout_duration = 50;
//  */


window.init = () => {


  setScreen();

  loadData(() => {

    console.log('Data loaded!');

    socket.on('emotion:update', updateEmotionCurried(() => {
      initTimelineIfItIsnt(); 
    }));

    socket.on('reflection:restart', () => {
      resetHTML();
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

  fetch(`/images/${curEmotion.base}/manifest`)
    .then(res => res.blob())
    .then(blob => blob.text())
    .then(text => { 
      imageList = JSON.parse(text);

      preloadedImages = [];
      imageList.forEach(url => {
        let img = new Image();
        img.src = url;
        preloadedImages.push(img);
      });
      cb(text);
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

  var thisEmotionMemories = dataMemories[curEmotion.base];

  let rng = seedrandom(curEmotion.base + new Date().getHours());
  // This means that the image sequence will rely on the current hour 

  let screenNumber;

  let imgCounter = 0;
  let memCounter = 0;

  
  while (imgCounter < imageList.length) {

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
      url: imageList[imgCounter++],
      left: `${ Math.random() * 80 }vw`,
      top: `${ Math.random() * 80 }vh`,
      screenNumber: screenNumber,
    });

    if (imgCounter < imageList.length && memCounter < thisEmotionMemories.length && rng() < 0.5) {
      thisMemPair.push({ 
        type: 'text',
        text: thisEmotionMemories[memCounter++],
        left: `${ Math.random() * 80 }vw`,
        top: `${ Math.random() * 80 }vh`,
        screenNumber: screenNumber,
      });
    } else {
      thisMemPair.push({
        type: 'image',
        url: imageList[imgCounter++],
        left: `${ Math.random() * 80 }vw`,
        top: `${ Math.random() * 80 }vh`,
        screenNumber: screenNumber,
      });
    }

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

function displayMemory(opts) {

  //{ data: mem, top: ~, left: ~, fadeIn: 100, fadeOut: 100 };
  let memdiv;
  let memory = opts.data;
 
  if (memory.type === 'text') {
    memdiv = $('<div></div>');
    memdiv.addClass('text');
    memdiv.text(memory.text);
  } 
  if (memory.type === 'image') {
    memdiv = $('<img></img>');
    memdiv.addClass('image');
    memdiv.attr('src', memory.url);
  } 

  memdiv.addClass('memory');
  memdiv.css({ top:  memory.top, left: memory.left });


  memdiv
    .hide()
    .appendTo('#memory_container')
    .fadeIn(opts.fadeIn);

}

/////////////////////////////////

function resetHTML(cb) {
  $('#meditation_text').fadeOut(1000, function() {
    $(this).empty();
    $(this).fadeIn(1000);
  });
  $('#memory_container').fadeOut(1000, function() {
    $(this).empty();
    $(this).fadeIn(1000);
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

  timeline.add({ time: timeMarker, event: function() { 
    $('#memory_container').fadeIn(memories_fadein_duration);
  } });



  ///////// QUEUE MEMORIES
  
  let mempairs = generateMemoryPairs();

  mempairs.forEach((mempair, i) => {

    timeline.add({ time: timeMarker, event: function() { 


      if (mempair[0].screenNumber === thisScreenParams.id || thisScreenParams.name === 'FULLSCREEN') {
      //only display if we're on the right screen
        //
        displayMemory({
          data: mempair[0],
          fadeIn: each_memory_fadein_duration,
          fadeOut: each_memory_fadeout_duration,
        });


        displayMemory({
          data: mempair[1],
          fadeIn: each_memory_fadein_duration,
          fadeOut: each_memory_fadeout_duration,
        });

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


function initTimelineIfItIsnt() {  

  if (timeline === undefined) {

    console.log('Initializing timeline');
 
    timeline = new Timeline({ loop: false, duration: 50000, interval: 100 }); 

    resetHTML();

    queueEvents(timeline);

    timeline.start();

  }
 
}




