// style and js imports
import $ from 'jquery';
import Papa from 'papaparse';
import '../css/02-reflection.scss';
import './shared.js';
import Timeline from './Timeline.js';

let emotions;
let curEmotion;





var triggerResetEmotion = false; // this is a global variable that every function checks to trigger a reset emotion. it's not the most elegant, but in this event-based loop, seems appropriate.

const socket = io();
socket.on('emotion:update', updateEmotion);
var dataLoaded = false;

function updateEmotion(msg) {
  if (!curEmotion || curEmotion.name !== msg.name) {
    curEmotion = msg;
    console.log('emotion has been updated to: ' + msg.name + ' (base: ' + msg.base + ', level: ' + msg.level +')');
    showLoadingOverlay(curEmotion.name);
    updateInterface();
  }
}

function updateInterface() {
  resetTimeline();
  triggerResetEmotion = true;
  $('#debug-info').text('CURRENT EMOTION: ' + curEmotion.name + ' (base: ' + curEmotion.base + ', level: ' + curEmotion.level +')')
}


///////////////////////////

var dataMeditations;
var dataMeditationEmotions;


function loadData(cb) {
  var dataLoaded = -2; // this is a bit hacky but simpler than Promises.all

  fetch('/data/02_meditation.txt')
    .then(res => res.blob())
    .then(blob => blob.text())
    .then(text => {
      dataMeditations = text.split(/\r?\n/);
      dataLoaded += 1;
      if(dataLoaded == 0) { cb(); }
    })


  // tweaked from 04-convo1.js
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

  return [
    { 
      type: "image",
      url: "https://i.imgur.com/Y3QNok5.png"
    },
    { 
      type: "text",
      text: "I feel like I'm just pouring all of my energy into a void."
    }
  ]

}

function displayMeditationPhrase(opts) {
  // opts: { text: mt, fadeIn: 100, fadeOut: 100 };
  $("#meditation_container")
    .fadeOut(opts.fadeOut, function() {
      $(this)
        .text(opts.text)
        .fadeIn(opts.fadeIn);
    })
}

function displayMemory(opts) {
  //{ data: mem, fadeIn: 100, fadeOut: 100 };
  let memdiv = $("<div class='memory'></div>")

  let memory = opts.data;
 
  if(memory.type == "text") {
    memdiv.text(memory.text)
  } else { 
    memdiv.text(memory.url)
  } 

  console.log("appending to memocontainer");

  $("#memory_container")
    .append(memdiv)
}

/////////////////////////////////

function resetHTML() {
  $("#meditation_container").empty();
  $("#memory_container").empty();
}

function queueEvents(timeline) {
  window.timeline = timeline;


  var timeMarker = 0;

  ///////// QUEUE MEDITATIONS
  
  let meditation_interval = 30;

  let mts = generateMeditationTexts();

  mts.forEach((mt, i) => {

    timeline.add({ time: timeMarker, event: function () { 
      console.log(mt); 
      displayMeditationPhrase({ text: mt, fadeIn: 100, fadeOut: 100 });
    } });

    timeMarker += meditation_interval;

  });
  

  ///////// MEDITATION FADES OUT

  timeMarker += 1000;

  timeline.add({ time: timeMarker, event: function () { 
    console.log("mc fde outfaein");
    $("#meditation_container").fadeOut(50);
  } });


  timeMarker += 1000;

  timeline.add({ time: timeMarker, event: function () { 
    $("#memory_container").fadeIn(500);
    console.log("faein");
  } });

  // TODO FIGURE OUT WHY ONE OF THESE FIRES 
  
  timeMarker += 1000;

  timeline.add({ time: timeMarker, event: function () { 
    $("#memory_container").fadeIn(500);
    console.log("faein");
  } });



  ///////// QUEUE MEMORIES

  let mems = generateMemories();
  let memory_interval = 300;

  mems.forEach((mem, i) => {

    timeline.add({ time: timeMarker, event: function () { 
      displayMemory({ data: mem, fadeIn: 100, fadeOut: 100 });
    } });

    timeMarker += memory_interval;

  });
 
  

}


function resetTimeline() {

  if(!dataLoaded) {
    // wait until data is loaded
    setTimeout(resetTimeline, 1000);
    return;
  }

  console.log("Resetting timeline");
 
  let timeline = new Timeline({ loop: true, duration: 50000, interval: 100 });

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


