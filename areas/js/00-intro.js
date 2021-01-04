// style and js imports
import $ from 'jquery';
import '../css/00-intro.scss';
import './shared.js';

let emotions;
let curEmotion;
let introText;
const socket = io();
socket.on('emotion:update', updateEmotion);

getIntroText();


function updateEmotion(msg) {
  console.log("updateEmotion")
  if (!curEmotion || curEmotion.name !== msg.name) {
    curEmotion = msg;
    console.log('emotion has been updated to: ' + msg.name + ' (base: ' + msg.base + ', level: ' + msg.level + ')');
    $(".intro-text-container").css("visibility", "hidden");
    showLoadingOverlay(curEmotion.name);
    updateInterface();
  }
}

function updateInterface() {
  console.log("updateInterface")
  $('#debug-info').text('CURRENT EMOTION: ' + curEmotion.name + ' (base: ' + curEmotion.base + ', level: ' + curEmotion.level + ')')
  scrollThis();

}

// window.scrollThis = () => {}

function getIntroText() {
  fetch('/data/00_intro.txt')
    .then(res => res.blob())
    .then(blob => blob.text())
    .then(text => {
      introText = text;
      console.log(introText)
      $(".text").text(introText);
    })
}

function scrollThis() {
  console.log("scrollThis")
  $(".text").scrollTop(0);
  $(".text").stop();
  console.log(introText)
  const scrollFast = 3000;
  const scrollSlow = 20000;

  setTimeout(function () {
    $(".intro-text-container").css("visibility", "visible");



    $(".text").animate({
      scrollTop: $(".text").prop("scrollHeight")
    }, scrollSlow, 'linear', function () {
      console.log("Complete");
      setTimeout(function () {
        $(".text").animate({
          scrollTop: 0
        }, scrollFast, 'linear', function () {
          console.log("Complete at the top");
          scrollThis();
        });

      }, 3000);

    });
  }, 2000);


}




