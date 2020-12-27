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



function fadeInMeditation() {
  return new Promise(function(resolve, reject) {

    $("#meditation_container").fadeIn(1000, () => {
      console.log("=== fade in meditation");
      // TODO
      resolve();
    });

  })

}


//////////////////////
//
function startMeditation() {
  return new Promise(function(resolve, reject) {



    function generateMeditationTexts() {

      var thisDataMeditationInserts = dataMeditationEmotions[curEmotion.name];

      return dataMeditations.map((m) => {
        var newm = m;
        for(let k in thisDataMeditationInserts) {
          newm = newm.replace(`[${k}]`, thisDataMeditationInserts[k]);
        }
        return newm;
      });
    }

    var texts = generateMeditationTexts();

    function displayPhrase(counter) {
      var medtext = texts[counter]
      $("#meditation_container").text(medtext)
    }

    //////////

    var interval = 300;
    var counter = 0;

    setInterval(function() {

      displayPhrase(counter);
      if(triggerResetEmotion) { reject("emotionReset");  } // exit anim loop if emotion is reset

      counter += 1;
      if(counter >= texts.length) { resolve() }
    }, interval);



  })
}

//////////////////////////

function fadeOutMeditation(interval) {
  return new Promise(function(resolve, reject) {
    if(triggerResetEmotion) { reject("emotionReset");  } // exit anim loop if emotion is reset

    $("#meditation_text").fadeOut(interval, () => {
      console.log("==== fade out meditation!"); 
      // TODO
      resolve();
    });

  })

}


//////////////////////



function fadeInMemories() {
  return new Promise(function(resolve, reject) {
    $("#memory_container").fadeIn(1000, () => {
      console.log("==== fade in memories!")
      resolve();
    });
  })
}




//////////////////////////

function startMemories() {
  return new Promise(function(resolve, reject) {
    if(triggerResetEmotion) { reject("emotionReset");  } // exit anim loop if emotion is reset

    setTimeout(() => {
      console.log("==== start memories!")
      // TODO
      resolve();
    }, 1000);

  })

}


//////////////////////////

function fadeOutMemories(interval) {
  return new Promise(function(resolve, reject) {
    $("#memory_container").fadeOut(interval, () => {
      console.log("==== fade outmemories!")
      resolve();
    });

  })

}




/////////////////////////

function clearAndInit() {
  console.log("clearAndInit");
}




// THIS IS WHERE THE MAGIC LOOP IS
var playLoop = function() {
  clearAndInit();
  fadeInMeditation()
    .then(res => startMeditation())
    .then(res => fadeOutMeditation(1000))
    .then(res => fadeInMemories())
    .then(res => startMemories())
    .then(res => fadeOutMemories(1000))
    .then(res => {
      playLoop();
    })
    .catch(error => {
      console.log("ALERT: ", error);
      if(error == "emotionReset") { resetPlay(); }
    });
}


function resetPlay() {

  // TODO: DO RESET STUFF HERE
  console.log("===== we are resetting play");

  if(triggerResetEmotion) {
/*
 TODO 
 * fadeOutMemories(0)
      .then(res => fadeOutMeditation(0)) 
      .catch(error => {})  */
    triggerResetEmotion = false;
    playLoop();
  }

}


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

  return ["yup", "nope"]

}

function displayMeditationPhrase(opts) {
  $("#meditation_container")
    .fadeOut(opts.fadeOut, function() {
      $(this)
        .text(opts.text)
        .fadeIn(opts.fadeIn);
    })
}

/////////////////////////////////

function resetHTML() {
  $("#meditation_container").empty();
  $("#memory_container").empty();
}

function queueEvents(timeline) {


  var timeMarker = 0;

  ///////// MEDITATIONS
  
  let meditation_interval = 300;

  let mts = generateMeditationTexts();

  mts.forEach((mt, i) => {

    timeline.add({ time: timeMarker, event: function () { 
      console.log(mt); 
      displayMeditationPhrase({ text: mt, fadeIn: 100, fadeOut: 100 });
    } });

    timeMarker += meditation_interval;

  });
  

  ///////// Meditation Fades Out

  timeMarker += 1000;

  timeline.add({ time: timeMarker, event: function () { 
    $("#meditation_container").fadeOut(500);
  } });

  timeMarker += 1000;

  ///////// MEMORIES

  let mems = generateMemories();
  let memory_interval = 300;

  mems.forEach((mem, i) => {

    timeline.add({ time: timeMarker, event: function () { 
      console.log(mem); 
//      displayMeditationPhrase({ text: mt, fadeIn: 100, fadeOut: 100 });
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


