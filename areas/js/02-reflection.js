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

    $("#meditation_text").fadeIn(1000, () => {
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
      $("#meditation_text").text(medtext)
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


//////////// MAIN ///////////////

$(document).ready(function() {

  setTimeout(function() { 
    loadData(() => {
      console.log("Data loaded!");
      dataLoaded = true;
      playLoop();
    });
  }, 1000);


  let t = new Timeline({ loop: true, duration: 5000, interval: 100 });

  t.add({ time: 0, event: function () { console.log("STARTbliop"); } });
  t.add({ time: 1000, event: function () { console.log("bliop"); } });
  t.add({ time: 2000, event: function () { console.log("boop"); } });
  t.add({ time: 4000, event: function () { console.log("bloooiop"); } });

  t.start({ callback: function() { console.log("we're done!!!");}  })

  window.t = t;


});
