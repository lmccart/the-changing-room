// style and js imports
import $ from 'jquery';
import Papa from 'papaparse';
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
var preloadedImages = [] // kept here to preload images; without this, some browsers might clear cache & unload images



const socket = io();
socket.on('emotion:update', updateEmotion);
var dataLoaded = false;

function updateEmotion(msg) {
  if (!curEmotion || curEmotion.name !== msg.name) {
    curEmotion = msg;
    console.log('emotion has been updated to: ' + msg.name + ' (base: ' + msg.base + ', level: ' + msg.level +')');
    showLoadingOverlay(curEmotion.name);
    updateImageList(() => {
        console.log(imageList);
        updateInterface();
    });
  }
}

function updateInterface() {
  resetTimeline();
  $('#debug-info').text('CURRENT EMOTION: ' + curEmotion.name + ' (base: ' + curEmotion.base + ', level: ' + curEmotion.level +')')
}


///////////////////////////

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
        preloadedImages.push(img)
      });
      cb(text);
    });

}

function loadData(cb) {
  var dataLoaded = -3; // this is a bit hacky but simpler than Promises.all

  fetch('/data/02_meditation.txt')
    .then(res => res.blob())
    .then(blob => blob.text())
    .then(text => {
      dataMeditations = text.split(/\r?\n/);
      dataLoaded += 1;
      if(dataLoaded == 0) { cb(); }
    })


  Papa.parse("/data/02_meditation_emotion_specific.tsv", {
    download: true,
    header: true,
    skipEmptyLines: 'greedy',
    complete: function(results) {
      const rawResults = results.data;
      // the data comes in as [{ "EMOTION": "annoyed", " BODY AREA": "Feel that...", ...} ...]
      // I (dan) think it should be { "annoyed": { "BODY AREA": 'string, "PERSON": 'string' } ... }
      console.log(rawResults);
      const reordered = {};

      for (var i = 0; i < rawResults.length; i++) {
        let thisrow = rawResults[i]

        var newrow = {};
        Object.keys(thisrow).forEach((key) => { newrow[key.trim()] = thisrow[key]; })

        reordered[thisrow["EMOTION"].trim()] = newrow;
      }
      dataMeditationEmotions = reordered;
      dataLoaded += 1;
      if(dataLoaded == 0) { cb(); }
    }
  });


  Papa.parse("/data/02_memories.tsv", {
    download: true,
    header: true,
    skipEmptyLines: 'greedy',
    complete: function(results) {
      const rawResults = results.data;
      // the data comes in as [{ "afraid": "One time this..", "alive": "one day...", ...} ...]
      // I (dan) think it should be { "annoyed": [ "One time", ...], "alive": ["one day", ..] /// 
      const reordered = {};

      for (var i = 0; i < rawResults.length; i++) {
        let thisrow = rawResults[i]

        var newrow = {};
        Object.keys(thisrow).forEach((key) => { 
          key = key.trim();
          if(key != "" && thisrow[key].trim() != "") {
            if(reordered[key] == undefined) { reordered[key] = []; }
            reordered[key].push(thisrow[key]);
          }
        })
      }
      dataMemories = reordered;
      dataLoaded += 1;
      if(dataLoaded == 0) { cb(); }
    }
  });


}


//////////////////////




function generateMeditationTexts() {

  let thisDataMeditationInserts = dataMeditationEmotions[curEmotion.name];

  return dataMeditations
    .map((m) => {
      let newm = m;
      for(let k in thisDataMeditationInserts) {
        newm = newm.replace(`[${k}]`, thisDataMeditationInserts[k]);
      }
      return newm;
    })
    .filter((m) => { return m != ""; });
}

function generateMemories() {

  var memories = [];

  dataMemories[curEmotion.base].forEach(m => {
    memories.push({ 
      type: "text",
      text: m,
    });
  });

  imageList.forEach(m => {
    memories.push({
      type: "image",
      url: m,
    });
  });

  return memories;

}

function displayMeditationPhrase(opts) {
  // opts: { text: mt, fadeIn: 100, fadeOut: 100 };
  $("#meditation_text")
    .fadeOut(opts.fadeOut, function() {
      $(this)
        .text(opts.text)
        .fadeIn(opts.fadeIn);
    })
}

function displayMemory(opts) {
  //{ data: mem, top: ~, left: ~, fadeIn: 100, fadeOut: 100 };
  let memdiv;
  let memory = opts.data;
 
  if(memory.type == "text") {
    memdiv = $("<div></div>");
    memdiv.addClass("text");
    memdiv.text(memory.text)
  } 
  if(memory.type == "image") {
    memdiv = $("<img></img>");
    memdiv.addClass("image");
    memdiv.attr("src", memory.url);
  } 

  memdiv.addClass("memory");
  memdiv.top = opts.top;
  memdiv.css({ top:  opts.top, left: opts.left });


  memdiv
    .hide()
    .appendTo("#memory_container")
    .fadeIn(opts.fadeIn);
}

/////////////////////////////////

function resetHTML(cb) {
  $("#meditation_text").fadeOut(1000, function() {
    $(this).empty();
    $(this).fadeIn(1000);
  });
  $("#memory_container").fadeOut(1000, function() {
    $(this).empty();
    $(this).fadeIn(1000);
  });
}

function queueEvents(timeline) {
  window.timeline = timeline;


  var timeMarker = 0;

  timeline.add({ time: timeMarker, event: function () { 
    $("#meditation_container").fadeIn(500);
    console.log("TIMELINE STARTING");
  } });



  ///////// QUEUE MEDITATIONS
  
  let meditation_interval = 3000;

  let mts = generateMeditationTexts();

  mts.forEach((mt, i) => {

    timeline.add({ time: timeMarker, event: function () { 
      console.log(mt); 
      displayMeditationPhrase({ text: mt, fadeIn: 500, fadeOut: 500 });
    } });

    timeMarker += (mt.split(" ").length * 250);
    timeMarker += meditation_interval;

  });
  

  ///////// MEDITATION FADES OUT
  //

  timeMarker += 1000;

  timeline.add({ time: timeMarker, event: function () { 
    $("#meditation_container").fadeOut(500);
  } });


  timeMarker += 1000;

  timeline.add({ time: timeMarker, event: function () { 
    $("#memory_container").fadeIn(500);
  } });



  ///////// QUEUE MEMORIES

  let mems = generateMemories();
  let memory_interval = 1000;

  mems.forEach((mem, i) => {

    timeline.add({ time: timeMarker, event: function () { 

      displayMemory({
        data: mem,
        fadeIn: 500,
        fadeOut: 500,
        left: `${ Math.random() * 80 }vw`, // TODO: better sizing
        top: `${ Math.random() * 80 }vh`
      })

    } });

    timeMarker += memory_interval;

  });
 
  
  timeMarker += 1000;

  timeline.add({ time: timeMarker, event: function () { 
    $("#meditation_text").empty();
    $("#memory_container").fadeOut(1000, function() {
      $(this).empty();
    });
  } });

  timeMarker += 1000;

  timeline.setDuration(timeMarker); // LOOP


}


function resetTimeline() {

  if(!dataLoaded) {
    // wait until data is loaded
    setTimeout(resetTimeline, 1000);
    return;
  }

  console.log("Resetting timeline");
 
  if(timeline === undefined) {
    timeline = new Timeline({ loop: true, duration: 50000, interval: 100 });
  } else {
    timeline.clear();
  }

  resetHTML();

  queueEvents(timeline);

  timeline.start();
 
}


/////////////////////////////////
/////////////////////////////////
/////////////////////////////////
//////////// MAIN ///////////////
/////////////////////////////////
/////////////////////////////////
/////////////////////////////////


loadData(() => {
  console.log("Data loaded!");
  dataLoaded = true;
});

// resetTimeline(); this is already called by updateEmotion() upon pageload;


