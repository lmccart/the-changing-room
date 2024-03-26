import $ from 'jquery';
import '../css/00-intro.scss';
import './shared.js';
import { getImgUrls, getTextColorForBackground, addSvgFilterForElement } from './lib/imageColorUtils.js';

/* VARIABLES */
const scroll_up_time = 20000;
const scroll_down_time = 300 * 1000;
const scroll_pause_time = 2000;
const scroll_resume_time = 10000;
const hand_blink_time = 700;
const hand_delay = 5000;

let video = true;
let curEmotion;
let imgUrls = [];

let selectedVoiceIndex = 9999;
let selectedVoice;

let hand_interval;
const handIndicator = $('#hand-indicator');


window.setupSound('environment');
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
  loadText();
};

window.loadingComplete = () => {
  $('.intro-text-container').css('visibility', 'visible');
  scrollDown();
  setHandInterval();
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

function loadText() {
  if (window.lang0 === window.lang1) { // if only one langauge, remove second text div
    $('#lang1-intro').remove();
    fetch(i18next.t('00_intro.txt'))
      .then(res => res.blob())
      .then(blob => blob.text())
      .then(text => {
        $('.text').html(text+'<br>&nbsp;');
      });
  } else { // otherwise, change font and add both texts
    $('.text').addClass('double-text');
    fetch(i18next.t('00_intro.txt', {lng: window.lang0}))
      .then(res0 => res0.blob())
      .then(blob0 => blob0.text())
      .then(text0=> {
        $('#lang0-intro').html(text0+'<br>&nbsp;');
        fetch(i18next.t('00_intro.txt', {lng: window.lang1}))
          .then(res1 => res1.blob())
          .then(blob1 => blob1.text())
          .then(text1 => {
            $('#lang1-intro').html(text1+'<br>&nbsp;');
          });
      });
  }
}

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

$('.holder').on('click wheel DOMMouseScroll mousewheel keyup touchmove', function(e) { 
  if (e.type !== 'click') {
    $('.holder').stop(true); 
  }
  setTimeout(() => {
    scrollResume();
  }, scroll_resume_time);

});

function scrollDown() {
  $('.holder').scrollTop(0);
  $('.holder').stop(); // can use a function like this to scroll down all the way, lines 249-274 03-selection.js
  setTimeout(() => {
    $('.holder').animate({
      scrollTop: $('.holder').prop('scrollHeight')
    }, scroll_down_time, 'linear', scrollUp);
  }, scroll_pause_time);
}

function scrollResume() {
  $('.holder').stop(true);
  let remainingDistance = $('.holder').prop('scrollHeight') - $('.holder').scrollTop() - $('.holder').height();
  let currentPercentage = $('.holder').scrollTop() / ($('.holder').prop('scrollHeight') - $('.holder').height());

  $('.holder').animate({
    scrollTop: '+=' + remainingDistance // Use relative animation to scroll from current position to bottom
  }, scroll_down_time * (1 - currentPercentage), 'linear', scrollUp);
  console.log('resume scroll ', scroll_down_time * (1 - currentPercentage), currentPercentage);
}

function scrollUp() {
  setTimeout(() => {
    $('.holder').animate({
      scrollTop: 0
    }, scroll_up_time, 'linear', scrollDown);
  }, 500);
}

/// HAND ICON ///
function setHandInterval() {
  if (hand_interval) {
    clearInterval(hand_interval); 
  }
  handIndicator.finish();//.fadeOut(0);
  hand_interval = setInterval(moveHand, hand_delay);
}

function moveHand() {
  // move hand to random position
  const w = $(window).width() - handIndicator.width();
  const h = $(window).height() - handIndicator.height();
  const nw = Math.floor(Math.random() * w);
  const nh = Math.floor(Math.random() * h);
  
  handIndicator.css({top: `${nh}px`, left: `${nw}px`});
  // then show hand
  handIndicator
    .finish()
    .fadeIn(0)
    .delay(hand_blink_time)
    .fadeOut(0)
    .delay(hand_blink_time)
    .fadeIn(0)
    .delay(hand_blink_time)
    .fadeOut(0)
    .delay(hand_blink_time)
    .fadeIn(0)
    .delay(hand_blink_time);
  //.fadeOut(0);
}

function debugToggle(msg) {
  console.log(msg);
}