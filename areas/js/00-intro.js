import $ from 'jquery';
import '../css/00-intro.scss';
import './shared.js';
import { getImgUrls, getTextColorForBackground, addSvgFilterForElement } from './lib/imageColorUtils.js';

/* VARIABLES */
const scroll_up_time = 20000;
const scroll_down_time = 500000;
const scroll_pause_time = 2000;

let video = true;
let curEmotion;
let imgUrls = [];

let selectedVoiceIndex = 9999;
let selectedVoice;

window.init = () => {
  if (video) {
    $('.backgrounds').hide();
    $('.backgrounds-video').show();
  } else {
    $('.backgrounds-video').hide();
    $('.backgrounds').show();
  }

  socket.on('emotion:update', updateEmotion);
  socket.on('debug:toggle', debugToggle);
  socket.emit('emotion:get');
  fetch(i18next.t('intro')) // translate for the proper text
    .then(res => res.blob())
    .then(blob => blob.text())
    .then(text => {
      $('.text').text(text);
    });
};

window.loadingComplete = () => {
  $('.intro-text-container').css('visibility', 'visible');
  scrollDown();
};

window.speechSynthesis.onvoiceschanged = function() {
  let voiceOptions = ['Ava', 'Allison', 'Samantha', 'Susan', 'Vicki', 'Kathy', 'Victoria'];
  let voices = window.speechSynthesis.getVoices();
  for (let v in voices) {
    let ind = voiceOptions.indexOf(voices[v].voiceURI);
    if (ind !== -1 && ind < selectedVoiceIndex) {
      selectedVoice = voices[v];
      selectedVoiceIndex = ind;
    }
  }
};


function updateEmotion(msg) {
  if (!curEmotion || curEmotion.name !== msg.name) {
    curEmotion = msg;
    console.log('emotion has been updated to: ' + msg.name + ' (base: ' + msg.base + ', level: ' + msg.level + ')');
    $('#debug-info').text('CURRENT EMOTION: ' + curEmotion.name + ' (base: ' + curEmotion.base + ', level: ' + curEmotion.level + ')');
    let durations = showLoadingOverlay(curEmotion);
    setTimeout(() => { updateInterface(durations); }, durations[0]);
    $('.intro-text-container').css('visibility', 'hidden');
  }
}

async function updateInterface(durations) {
  // $('svg').remove();
  const colors = window.baseColors[curEmotion.base][curEmotion.level - 1];

   
  if (video) {
    switchVideoBackgrounds(curEmotion, durations[1] - durations[0] - 500, colors);
  } else {
    imgUrls = await getImgUrls(curEmotion.base, curEmotion.level);
    switchBackgrounds(imgUrls, durations[1] - durations[0] - 500, colors);
  }

  const textColor = getTextColorForBackground(colors[0]);//, colors[1]);
  $('body').removeClass().addClass(textColor);
  $('.intro-text-container').css('border-color', textColor);
  $('.text').css('color', textColor);
}

function scrollDown() {
  $('.text').scrollTop(0);
  $('.text').stop();
  setTimeout(() => {
    $('.text').animate({
      scrollTop: $('.text').prop('scrollHeight')
    }, scroll_down_time, 'linear', scrollUp);
  }, scroll_pause_time);
}

function scrollUp() {
  setTimeout(() => {
    $('.text').animate({
      scrollTop: 0
    }, scroll_up_time, 'linear', scrollDown);
  }, 500);
}


function debugToggle(msg) {
  console.log(msg);
}