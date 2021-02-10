import $ from 'jquery';
import { getTextColorForBackground, addSvgFilterForElement } from './lib/imageColorUtils.js';


window.loadingDur = 7000;
window.loadingFadeDur = 300;

window.socket = io();
window.socket.on('debug:toggle', debugToggle);

document.title = $('#debug-area').text();
console.log($('#debug-area').text());

// getting areas and colors from the data file
fetch('/static/data/data.json')
  .then(res => { return res.json(); })
  .then(data => {
    window.baseColors = data.colors;

    appendDebug();

    let areaName = window.location.pathname.substring(1);
    let areaData = data.areas[areaName];
    if (areaData) {
      $('#area-name').text(areaName);
      $('#area-display').text(areaData.display);
      $('#debug-area').text(`${areaName} DIMS: ${window.innerWidth} ${window.innerHeight}`);
    }

    if (window.init) {
      window.init(areaData);
    }
  });

window.showLoadingOverlay = (newEmotion) => {
  const colors = window.baseColors[newEmotion.base][newEmotion.level - 1];
  const textColor = getTextColorForBackground(colors[0]);
  $('#loading').css('color', 'black');
  $('#loading-bg').show();
  $('#loading-bg').delay(2000).fadeOut(1000);

  $('#loading-emotion').text(newEmotion.name);
  $('#loading').fadeIn(window.loadingFadeDur);


  setTimeout(function() {
    $('#loading').fadeOut(window.loadingFadeDur, () => {
      $('#loading-emotion').empty();
    });
    if (window.loadingComplete) {
      window.loadingComplete();
    }
  }, loadingDur);
  return [window.loadingFadeDur, window.loadingDur];
};


window.switchBackgrounds = (imgUrls, fadeDur, colors) => {
  return new Promise(resolve => {
    const bgToHide = $('#background-1').is(':visible') ? $('#background-1') : $('#background-2');
    const bgToShow = $('#background-1').is(':visible') ? $('#background-2') : $('#background-1');

    if (colors) {
      let svgId = addSvgFilterForElement(bgToShow, colors);
      let oldSvgId = bgToShow.data('svgId');
      $(`#${oldSvgId}`).remove();
      bgToShow.data('svgId', svgId);
    }
    
    const imgUrl = imgUrls[Math.floor(Math.random() * imgUrls.length)];
    bgToShow.css('background-image', `url(${imgUrl})`);
    $('#loader').attr('src', imgUrl).off();
    $('#loader').attr('src', imgUrl).on('load', function() {
      console.log('loaded: ', imgUrl);
      bgToShow.fadeIn(fadeDur);
      bgToHide.fadeOut(fadeDur);
      resolve();
    });
  });
};

window.switchVideoBackgrounds = (emotion, fadeDur, colors) => {
  const bgToHide = $('#video-1').is(':visible') ? $('#video-1') : $('#video-2');
  const bgToShow = $('#video-1').is(':visible') ? $('#video-2') : $('#video-1');
  bgToShow.off('canplaythrough');
  bgToHide.off('canplaythrough');

  if (colors) {
    let svgId = addSvgFilterForElement(bgToShow, colors);
    let oldSvgId = bgToShow.data('svgId');
    $(`#${oldSvgId}`).remove();
    bgToShow.data('svgId', svgId);
  }
  
  bgToShow.attr('src', `./images/videos/${emotion.base}${emotion.level}.mp4`);
  bgToShow.on('canplaythrough', () => {
    console.log('loaded: ', emotion.base, emotion.level);
    bgToShow.fadeIn(fadeDur);
    bgToHide.delay(500).fadeOut(fadeDur);
  });
};

function appendDebug() {
  $('body').append(`<section id='debug-screen'>
    <div id='area-info'>
      <div id='area-name'></div>
      <div id='area-display'></div>
      <div id='area-extra'></div>
    </div>
  </section>`);

  /*
  <section id='debug'>
    AREA: <span id='debug-area'></span>
    <div id='debug-info'></div>
  </section>
  */
 
  setTimeout(function() {
    $('#debug-screen').hide();
  }, 5 * 100);
}

// for hot reloading
if (module.hot) {
  module.hot.accept(); 
}

function debugToggle(msg) {
  console.log('debug toggle');
  if (msg.val) $('#debug-screen').show();
  else $('#debug-screen').hide();
}
