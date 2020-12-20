// style and js imports
import $ from 'jquery';
import Papa from 'papaparse';
import '../css/02-reflection.scss';
import './shared.js';

let emotions;
let curEmotion;
const socket = io();
socket.on('emotion:update', updateEmotion);

function updateEmotion(msg) {
  if (!curEmotion || curEmotion.name !== msg.name) {
    curEmotion = msg;
    console.log('emotion has been updated to: ' + msg.name + ' (base: ' + msg.base + ', level: ' + msg.level +')');
    showLoadingOverlay(curEmotion.name);
    updateInterface();
  }
}

function updateInterface() {
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



function fadeInText() {
  return new Promise(function(resolve, reject) {

    $("#meditation_text").fadeIn(1000, () => {
      console.log("pop in text!"); 
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

      // TODO:animation stuff
    }

    //////////

    var interval = 100;
    var counter = 0;

    setInterval(function() {

      displayPhrase(counter);

      counter += 1;
      if(counter >= texts.length) { resolve() }
    }, interval);



  })
}

//////////////////////////

function fadeOutText() {
  return new Promise(function(resolve, reject) {

    $("#meditation_text").fadeOut(1000, () => {
      console.log("pop out text!"); 
      // TODO
      resolve();
    });

  })

}




//////////////////////////

function startMemories() {
  return new Promise(function(resolve, reject) {

    console.log("start memories!")
    setTimeout(() => {
      console.log("end memories!")
      // TODO
      resolve();
    }, 1000);

  })

}





//////////// MAIN ///////////////
//

$(document).ready(function() {

  setTimeout(function() { // TODO temporary only until we figure out emotion loading 

    loadData(() => {
      console.log("Data loaded!");


      var play = function() {
        fadeInText()
          .then(res => startMeditation())
          .then(res => fadeOutText())
          .then(res => startMemories())
          .then(res => {
            play();
          });
        }

      play();

      console.log(dataMeditations);
      console.log(dataMeditationEmotions);
    });

  }, 1000);

});
