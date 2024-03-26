// style and js imports
import $ from 'jquery';
import Papa from 'papaparse';

import '../css/05-convo2.scss';
import './shared.js';
import { getImgUrls, getTextColorForBackground } from './lib/imageColorUtils.js';
import i18next from 'i18next';

let curEmotion;
let imgUrls = [];
let initTimeout;
let typeTimeout;
let loadingTimeout;
const typingSpeed = 200;
const pauseOnInstructionTime = 20 * 1000;
const pauseVariationTime = 20 * 1000;
const loadingBarTime = 4000;
let curInstruction = 0;
let instructions, instructionsi18n;
let colors;

window.soundType = 'mute';
window.init = () => {
  // Instructions loading i18n
  const loading = window.bilingual 
    ? i18next.t('next_instruction_shortly', {lng: window.lang0}) + '<br/>' + i18next.t('next_instruction_shortly', {lng: window.lang1}) 
    : i18next.t('next_instruction_shortly', {lng: window.lang0});

  $('#loading-text').html(loading);

  Papa.parse(i18next.t('05_directions.tsv', {lng: window.lang0}), {
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
      instructions = reordered;
    }
  });

  // if secondary language is different, load in tsv
  if (window.bilingual) {
    Papa.parse(i18next.t('05_directions.tsv', {lng: window.lang1}), {
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
        instructionsi18n = reordered;
        console.log(instructionsi18n);
      }
    });
  }

  socket.on('emotion:update', updateEmotion);
  socket.emit('emotion:get');
};

window.loadingComplete = () => {
  showConvoLoading();
};

function updateEmotion(msg) {
  if (!curEmotion || curEmotion.name !== msg.name) {
    curEmotion = msg;
    console.log('emotion has been updated to: ' + msg.name + ' (base: ' + msg.base + ', level: ' + msg.level + ')');
    updateInterface();
  }
}

async function updateInterface() {
  $('#debug-info').text('CURRENT EMOTION: ' + curEmotion.name + ' (base: ' + curEmotion.base + ', level: ' + curEmotion.level + ')');
 
  const durations = showLoadingOverlay(curEmotion);
  reset();
  imgUrls = await getImgUrls(curEmotion.base, curEmotion.level);
  colors = window.baseColors[curEmotion.base][curEmotion.level - 1];
  switchBackgrounds(imgUrls, durations[1] - durations[0] - 500, colors);
  
  const textColor = getTextColorForBackground(colors[0], colors[1]);
  $('#loading').css('color', textColor);
  $('.bar-container').css('color', textColor);
  $('#loading-bar').removeClass();
  $('#loading-bar').addClass(textColor);
  $('.instruction-container').css('border-color', colors[1]);
  $('#instruction').css('color', textColor);
  $('#instruction-i18n').css('color', textColor);
  if (window.bilingual) { // changing font size depending on presence of second name
    $('#instruction').css('font-size', '4vw');
    $('#instructioni18n').css('font-size', '4vw');
  } else {
    $('#instruction').css('font-size', '8vw');
  }
}

function reset() {
  clearTimeout(initTimeout);
  clearTimeout(typeTimeout);
  clearTimeout(loadingTimeout);
  $('#instruction').empty();
  window.bilingual ? $('#instruction-i18n').empty() : $('#instruction-i18n').remove();
  $('#convo-loading').hide();
}

function showConvoLoading() {
  $('#convo-loading').show();
  $('#instruction').empty();
  $('#instruction-i18n').empty();
  clearTimeout(initTimeout);

  initTimeout = setTimeout(() => {
    // hide loading bar
    $('#convo-loading').hide();

    // start typing instruction
    let lastInstruction = curInstruction;
    while (lastInstruction === curInstruction) {
      curInstruction = Math.floor(Math.random() * instructions[curEmotion.base].length); 
    }
    const instruction = instructions[curEmotion.base][curInstruction];
    const instructioni18n = window.bilingual ? instructionsi18n[curEmotion.base][curInstruction] : undefined;
    
    // need to find a way to delay the reset for the longer instruction
    // how long is typing speed?

    switchBackgrounds(imgUrls, 1000, colors);

    if (window.bilingual) {
      const isLonger = instruction.length >= instructioni18n.length;
      typeInstruction(instruction, '#instruction', isLonger);
      typeInstruction(instructioni18n, '#instruction-i18n', !isLonger);
    } else {
      typeInstruction(instruction, '#instruction', true);
    }

  }, loadingBarTime);
}

// 200 * each letter
// select pause time and pass in the same one?
// check for longer and remoce 

function typeInstruction(string, element, longest, iteration) {
  console.log('typing for', element);
  var iteration = iteration || 0;
  
  // Prevent our code executing if there are no letters left
  if (iteration === string.length) {
    if (longest) {
      loadingTimeout = setTimeout(() => {
        showConvoLoading();
        $('#instruction').empty();
        $('#instruction-i18n').empty();
      }, pauseOnInstructionTime + Math.random(0, pauseVariationTime));
    }
    return;
  }
  
  typeTimeout = setTimeout(() => {
    // Set the instruction to the current text + the next character
    // whilst incrementing the iteration variable
    $(element).text($(element).text() + string[iteration++]);
    
    // Re-trigger our function
    typeInstruction(string, element, longest, iteration);
  }, typingSpeed);
}
