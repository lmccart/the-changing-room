// style and js imports
import $ from 'jquery';
import Papa from 'papaparse';

import '../css/05-convo2.scss';
import './shared.js';
import { getImgUrls, addSvgFilterForElement, getTextColorForBackground } from './lib/imageColorUtils.js';

let curEmotion;
let imgUrls = [];
let initTimeout;
let typeTimeout;
let loadingTimeout;
const typingSpeed = 200;
const pauseOnInstructionTime = 30 * 1000;
const pauseVariationTime = 20 * 1000;
const loadingBarTime = 4000;
let curInstruction = 0;
let instructions;

window.init = () => {
  socket.on('emotion:update', updateEmotion);
  socket.emit('emotion:get');
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
  showLoadingOverlay(curEmotion, showConvoLoading);
  imgUrls = await getImgUrls(curEmotion.base);
  reset();
  $('svg').remove();
  const colors = window.baseColors[curEmotion.base][curEmotion.level - 1];
  addSvgFilterForElement($('#background-1'), colors);
  addSvgFilterForElement($('#background-2'), colors);
  
  const textColor = getTextColorForBackground(colors[0], colors[1]);
  $('#loading').css('color', textColor);
  $('.bar-container').css('color', textColor);
  $('#loading-bar').removeClass();
  $('#loading-bar').addClass(textColor);
  $('.instruction-container').css('border-color', textColor);
  $('#instruction').css('color', textColor);
}

Papa.parse('/static/data/05_directions.tsv', {
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

function switchBackgrounds() {
  const bgToHide = $('#background-1').is(':visible') ? $('#background-1') : $('#background-2');
  const bgToShow = $('#background-1').is(':visible') ? $('#background-2') : $('#background-1');
  
  const imgUrl = imgUrls[Math.floor(Math.random() * imgUrls.length)];
  bgToShow.css('background-image', `url(${imgUrl})`);
  $('#loader').attr('src', imgUrl).off();
  $('#loader').attr('src', imgUrl).on('load', function() {
    console.log('loaded: ', imgUrl);
    bgToShow.fadeIn();
    bgToHide.fadeOut();
  });
}

function reset() {
  clearTimeout(initTimeout);
  clearTimeout(typeTimeout);
  clearTimeout(loadingTimeout);
  $('#instruction').empty();
  $('#convo-loading').hide();
}

function showConvoLoading() {
  $('#convo-loading').show();
  $('#instruction').empty();
  clearTimeout(initTimeout);

  switchBackgrounds();

  initTimeout = setTimeout(() => {
    // hide loading bar
    $('#convo-loading').hide();

    // start typing instruction
    let lastInstruction = curInstruction;
    while (lastInstruction === curInstruction) {
      curInstruction = Math.floor(Math.random() * instructions[curEmotion.base].length); 
    }
    
    const instruction = instructions[curEmotion.base][curInstruction];
    typeInstruction(instruction);
  }, loadingBarTime);
}

function typeInstruction(string, iteration) {
  var iteration = iteration || 0;
  
  // Prevent our code executing if there are no letters left
  if (iteration === string.length) {

    loadingTimeout = setTimeout(() => {
      showConvoLoading();
      $('#instruction').empty();
    }, pauseOnInstructionTime + Math.random(0, pauseVariationTime));
    return;
  }
  
  typeTimeout = setTimeout(() => {
    // Set the instruction to the current text + the next character
    // whilst incrementing the iteration variable
    $('#instruction').text($('#instruction').text() + string[iteration++]);
    
    // Re-trigger our function
    typeInstruction(string, iteration);
  }, typingSpeed);
}
