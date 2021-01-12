// style and js imports
import $ from 'jquery';
import '../css/00-intro.scss';
import './shared.js';
import { getImgUrls, addSvgFilterForElement, getTextColorForBackground } from './lib/imageColorUtils.js';

/* VARIABLES */
const scroll_up_time = 5000;
const scroll_down_time = 30000;
const scroll_pause_time = 3000;

let curEmotion;
let imgURLs = [];

let socket = io();
socket.on('emotion:update', updateEmotion);

getIntroText();

function updateEmotion(msg) {
  console.log("updateEmotion")
  if (!curEmotion || curEmotion.name !== msg.name) {
    curEmotion = msg;
    console.log('emotion has been updated to: ' + msg.name + ' (base: ' + msg.base + ', level: ' + msg.level + ')');
    updateInterface();

    $(".intro-text-container").css("visibility", "hidden");

  }
}

async function updateInterface() {
  console.log("updateInterface")
  showLoadingOverlay(curEmotion, function() {
    $(".intro-text-container").css("visibility", "visible");
    scrollThis();
  });
  $('#debug-info').text('CURRENT EMOTION: ' + curEmotion.name + ' (base: ' + curEmotion.base + ', level: ' + curEmotion.level + ')')
  $('svg').remove();
  imgURLs = await getImgUrls(curEmotion.base);
  addSvgFilterForElement($('#background-1'), window.baseColors[curEmotion.base][curEmotion.level-1]);
  console.log(window.baseColors[curEmotion.base], "!!!!!!")
  updateBackground();

}

function updateBackground() {
  const imgUrl = imgURLs[Math.floor(Math.random() * imgURLs.length)]
  console.log(imgUrl);
  $('#background-1').css('background-image', `url(${imgUrl})`);
  $('#loader').attr('src', imgUrl).on('load', function() {
    console.log('loaded: ', imgUrl)
    $('#background-1').show();
  });
}

function getIntroText() {
  fetch('/data/00_intro.txt')
    .then(res => res.blob())
    .then(blob => blob.text())
    .then(text => {
      $(".text").text(text);
    })
}

function scrollThis() {
  console.log("scrollThis")
  $(".text").scrollTop(0);
  $(".text").stop();

  setTimeout(function() {
    $(".text").animate({
      scrollTop: $(".text").prop("scrollHeight")
    }, scroll_down_time, 'linear', function () {
      console.log("Complete");
      setTimeout(function () {
        $(".text").animate({
          scrollTop: 0
        }, scroll_up_time, 'linear', function () {
          console.log("Complete at the top");
          scrollThis();
        });
      }, scroll_pause_time);
    });
  }, scroll_pause_time);


}
