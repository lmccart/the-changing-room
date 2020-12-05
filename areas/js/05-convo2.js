// style and js imports
import Papa from 'papaparse';

import '../css/05-convo2.scss';
import './shared.js';

let emotions;
let curEmotion;
const socket = io();
socket.on('emotion:update', updateEmotion);
const typingSpeed = 200; // milliseconds
const pauseOnInstructionTime = 5000; // 3s
let instructionArrayPosition = 0; // so we don't have repeats, this may not be better than random

function updateEmotion(msg) {
  if (!curEmotion || curEmotion.name !== msg.name) {
    curEmotion = msg;
    console.log('emotion has been updated to: ' + msg.name + ' (base: ' + msg.base + ', level: ' + msg.level +')');
    showConvoLoading();
    updateInterface();
  }
}

function updateInterface() {
  $('#debug-info').text('CURRENT EMOTION: ' + curEmotion.name + ' (base: ' + curEmotion.base + ', level: ' + curEmotion.level +')')
}

Papa.parse("/data/05_directions.tsv", {
  download: true,
  header: true,
  skipEmptyLines: 'greedy',
  complete: function(results) {
    const rawResults = results.data;
    // the data comes in as [{angry: 'string', sad: 'string'}, ...]
    // I (sam) think it should be {angry: ['string', 'string'], sad:['string', 'string']...}
    const reordered = {};
    const keys = Object.keys(rawResults[0]);
    keys.forEach(key => reordered[key] = []);

    for (var i = 0; i < rawResults.length; i++) {
      const resultRow = rawResults[i];
      keys.forEach(key => resultRow[key].trim().length > 0 && reordered[key].push(resultRow[key]));
    }
    window.instructions = reordered;
  }
});

function showConvoLoading() {
  $('#convo-loading').addClass('show');

  setTimeout(() => {
    // hide loading bar
    $('#convo-loading').removeClass('show')

    // start typing instruction
    const instruction = window.instructions[curEmotion.base][instructionArrayPosition];

    typeInstruction(instruction);

    if (instructionArrayPosition === window.instructions[curEmotion.base].length) {
      instructionArrayPosition = 0;
    } else {
      instructionArrayPosition ++;
    }
  }, 4000);
}

function typeInstruction(string, iteration) {
    var iteration = iteration || 0;
    
    // Prevent our code executing if there are no letters left
    if (iteration === string.length) {

        setTimeout(() => { 
          showConvoLoading();
          $('#instruction').empty();
        }, pauseOnInstructionTime)
        return;
    }
    
    setTimeout(function() {
        // Set the instruction to the current text + the next character
        // whilst incrementing the iteration variable
        $('#instruction').text( $('#instruction').text() + string[iteration++] );
        
        // Re-trigger our function
        typeInstruction(string, iteration);
    }, typingSpeed);
}
