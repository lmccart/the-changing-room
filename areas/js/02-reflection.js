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


function startMeditation() {
  return new Promise(function(resolve, reject) {

    var interval = 1000;
    var counter = 0;


    function getPhrase(counter) {
      var text = dataMeditations[counter]

/*      for(let k in dataMeditationEmotions) {
        console.log(k);
      } */

      return text;

    }

    function displayPhrase(counter) {
      var medtext = getPhrase(counter)


      $("#meditation_text").text(medtext)
    }

    setInterval(function() {

      // do stuff
      displayPhrase(counter);

      counter += 1;
      if(counter >= 5) { resolve() }
    }, interval);



  })
}




//////////// MAIN ///////////////
//

$(document).ready(function() {

  loadData(() => {
    console.log("Data loaded!");


    startMeditation()
      .then(res => {
        console.log(res);
      });

    console.log(dataMeditations);
    console.log(dataMeditationEmotions);
  });

});
