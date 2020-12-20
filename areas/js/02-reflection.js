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
      // the data comes in as [{angry: 'string', sad: 'string'}, ...]
      // I (sam) think it should be {angry: ['string', 'string'], sad:['string', 'string']...}
      const reordered = {};
      const keys = Object.keys(rawResults[0]);
      keys.forEach(key => reordered[key.trim()] = []);

      for (var i = 0; i < rawResults.length; i++) {
        const resultRow = rawResults[i];
        keys.forEach((key) => resultRow[key].trim().length > 0 && reordered[key.trim()].push(resultRow[key]));
      }
      dataMeditationEmotions = reordered;
      dataLoaded += 1;
      if(dataLoaded == 0) { cb(); }
    }
  });
}



//////////// MAIN ///////////////
//
loadData(() => {
  console.log("Data loaded!");
  console.log(dataMeditations);
  console.log(dataMeditationEmotions);
});

$(document).ready(function() {



});
