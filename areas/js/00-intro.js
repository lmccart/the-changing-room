import $ from 'jquery';
import '../css/00-intro.scss';
import './shared.js';
import { getImgUrls, addSvgFilterForElement, getTextColorForBackground } from './lib/imageColorUtils.js';

/* VARIABLES */
const scroll_up_time = 5000;
const scroll_down_time = 200000;
const scroll_pause_time = 3000;

let curEmotion;
let imgUrls = [];

window.init = () => {
  socket.on('emotion:update', updateEmotion);
  socket.emit('emotion:get');
  fetch('/static/data/00_intro.txt')
    .then(res => res.blob())
    .then(blob => blob.text())
    .then(text => {
      $('.text').text(text);
    });
};

window.loadingComplete = () => {
  console.log('sodfdfs');
  $('.intro-text-container').css('visibility', 'visible');
  scrollDown();
};

function updateEmotion(msg) {
  console.log('updateEmotion');
  if (!curEmotion || curEmotion.name !== msg.name) {
    curEmotion = msg;
    console.log('emotion has been updated to: ' + msg.name + ' (base: ' + msg.base + ', level: ' + msg.level + ')');
    let durations = showLoadingOverlay(curEmotion);
    setTimeout(() => { updateInterface(durations); }, durations[0]);
    $('.intro-text-container').css('visibility', 'hidden');
  }
}

async function updateInterface(durations) {
  // $('svg').remove();
  const colors = window.baseColors[curEmotion.base][curEmotion.level - 1];

  imgUrls = await getImgUrls(curEmotion.base);
  switchBackgrounds(imgUrls, durations[1] - durations[0], colors);

  const textColor = getTextColorForBackground(colors[0], colors[1]);
  $('body').removeClass().addClass(textColor);
  $('.intro-text-container').css('border-color', textColor);
  $('.text').css('color', textColor);
  $('#loading').css('color', textColor);
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
  }, scroll_pause_time);
}

