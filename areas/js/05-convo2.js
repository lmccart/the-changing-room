// style and js imports
import $ from 'jquery';
import Papa from 'papaparse';

import '../css/05-convo2.scss';
import './shared.js';
import { getImgUrls, addSvgFilterForElement, getTextColorForBackground } from './lib/imageColorUtils.js';

let curEmotion;
let imgURLs = [];
let initTimeout;
let typeTimeout;
const socket = io();
socket.on('emotion:update', updateEmotion);
const typingSpeed = 200; // milliseconds
const pauseOnInstructionTime = 5000; // 3s
let instructionArrayPosition = 0; // so we don't have repeats, this may not be better than random

function updateEmotion(msg) {
  if (!curEmotion || curEmotion.name !== msg.name) {
    curEmotion = msg;
    console.log('emotion has been updated to: ' + msg.name + ' (base: ' + msg.base + ', level: ' + msg.level +')');
    updateInterface();
  }
}

async function updateInterface() {
  $('#debug-info').text('CURRENT EMOTION: ' + curEmotion.name + ' (base: ' + curEmotion.base + ', level: ' + curEmotion.level +')')
  showLoadingOverlay(curEmotion.name, showConvoLoading);
  imgURLs = await getImgUrls(curEmotion.base);
  reset();
  $('svg').remove();
  addSvgFilterForElement($('#background-1'), window.baseColors[curEmotion.base][curEmotion.level-1]);
  addSvgFilterForElement($('#background-2'), window.baseColors[curEmotion.base][curEmotion.level-1]);
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

function switchBackgrounds() {
  const bgToHide = $('#background-1').is(":visible") ? $('#background-1') : $('#background-2');
  const bgToShow = $('#background-1').is(":visible") ? $('#background-2') : $('#background-1');
  
  const imgUrl = imgURLs[Math.floor(Math.random() * imgURLs.length)]
  console.log(imgUrl);
  bgToShow.css('background-image', `url(${imgUrl})`);
  $('#loader').attr('src', imgUrl).on('load', function() {
    console.log('loaded: ', imgUrl)
    bgToShow.show();
    bgToHide.hide();
  });
}

function reset() {
  clearTimeout(initTimeout);
  clearTimeout(typeTimeout);
  $('#instruction').empty();
  $('#convo-loading').removeClass('show');
}

function showConvoLoading() {
  $('#convo-loading').addClass('show');
  $('#instruction').empty();
  clearTimeout(initTimeout);

  switchBackgrounds();

  initTimeout = setTimeout(() => {
    // hide loading bar
    $('#convo-loading').removeClass('show')

    // start typing instruction
    const instruction = window.instructions[curEmotion.base][instructionArrayPosition];

    typeInstruction(instruction);

    if (instructionArrayPosition === window.instructions[curEmotion.base].length - 1) {
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
    
    typeTimeout = setTimeout(function() {
        // Set the instruction to the current text + the next character
        // whilst incrementing the iteration variable
        $('#instruction').text( $('#instruction').text() + string[iteration++] );
        
        // Re-trigger our function
        typeInstruction(string, iteration);
    }, typingSpeed);
}
