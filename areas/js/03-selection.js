// style and js imports
import $ from 'jquery';
import '../css/03-selection.scss';
import './shared.js';
import i18next from 'i18next';

// VARIABLES
const num_panels = 3;
const idle_timeout = 30;
const scroll_timeout = 5;
const scroll_down_time = 990000;
const scroll_up_time = 15000;
const scroll_pause_time = 1000;
const hand_blink_time = 700;
const hand_delay = 5000;
const fade_time = 1000;

const separate_scroll_times = [
  110 * 1000,
  78 * 1000,
  125 * 1000,
  52 * 1000
];
let play_speed = 1;

let curEmotion;

const separate_panels = [];
for (let i = 0; i < num_panels; i++) {
  separate_panels.push(document.getElementById('scroll' + i)); 
}

const handIndicator = $('#hand-indicator');
const apiURL_emotions = '/emotions';
let emotions;
let panelArrayL0 = [];
let panelArrayL1 = [];

let timer;
let timer_to_idle;
let hand_interval;
let isSwiping = 0;

window.introLang = 0;

window.soundType = 'mute';
window.init = () => {
  //READ IN EMOTION JSON
  fetch(apiURL_emotions)
    .then(response => response.json())
    .then(data => { 
      emotions = data;
      console.log(emotions);

      Object.keys(emotions)
        .sort((a, b) => {
          // return i18next.t(a).localeCompare(i18next.t(b)); // for sorting on translated value
          return a.localeCompare(b);
        })
        .forEach(function(emotion, i) {
          let base_emotion = emotions[emotion].base;
          let emotion_t = i18next.t(emotion);
          let emotion_div = $('<div>', {
            'id': `option-${emotion}`,
            'class': 'emotion', 
            text: `${emotion}`});
          emotion_div.on('click touchend', (e) => {
            if (isSwiping < 5) {
              socket.emit('emotion:pick', `${emotion}`);
            }
          });
          let emotion_t_div = $('<div>', {
            'id': `option-${emotion}-t`,
            'class': 'emotion-t', 
            text: `${emotion_t}`});
          emotion_t_div.on('click touchend', (e) => {
            if (isSwiping < 5) {
              socket.emit('emotion:pick', `${emotion}`);
            }
          });
          $('#scroll_joined').append(emotion_div);
          $('#scroll_joined').append(emotion_t_div);
        });
      socket.on('emotion:update', updateEmotion);
      socket.emit('emotion:get');
      separateMode();
      setHandInterval();

      // setInterval(testTrigger, 10 * 60 * 1000); // test every 10 mins
    });

  $(document).on('touchstart', () => { 
    isSwiping = 0; 
  });
  $(document).on('touchmove', () => { 
    isSwiping++; 
  });

  // READ IN SELECTION TEXT
  fetch(i18next.t('03_selection_intro', {lng: window.lang0}))
    .then(response => response.text())
    .then(text => selection_txt_parse(text, panelArrayL0));

  fetch(i18next.t('03_selection_intro', {lng: window.lang1}))
    .then(response => response.text())
    .then(text => selection_txt_parse(text, panelArrayL1));

  $('#wrapper_separate').hide();
  // DO ANY OTHER INIT JQUERY STUFF
  $(document).on('contextmenu', function() {
    return false;
  });
  
};

function updateEmotion(msg) {
  console.log('update emotion');
  console.log(msg);
  if (!curEmotion || curEmotion.name !== msg.name) {
    curEmotion = msg;
    console.log('emotion has been updated to: ' + msg.name + ' (base: ' + msg.base + ', level: ' + msg.level + ')');
    $('body').addClass('notouch').delay(window.loadingDur - 1000).queue(next => { // 5 second delay before enabled
      $('body').removeClass('notouch');
      next();
    });
    updateInterface();
  }
}

function updateInterface() {
  $('#debug-info').text('CURRENT EMOTION: ' + curEmotion.name + ' (base: ' + curEmotion.base + ', level: ' + curEmotion.level + ')');
  $('#emotions').val(curEmotion.name);

  $('.emotion, .emotion-t').removeAttr('style');
  $('.emotion, .emotion-t').removeClass('selected_emotion');
  //get color of selected emotion colors
  let emotion_colors = baseColors[curEmotion.base][curEmotion.level - 1];

  const $elm = $('#option-' + curEmotion.name);
  const $elm_t = $('#option-' + curEmotion.name + '-t');

  let prevEmotions = [];
  let nextEmotions = [];
  const numEmotions = 7;

  $elm.prevAll().slice(0, numEmotions).each(function() {
    prevEmotions.push($(this).html());
    styleLoading($(this), true);
  });

  $elm_t.nextAll().slice(0, numEmotions).each(function() {
    nextEmotions.push($(this).html());
    styleLoading($(this), true);
  });

  function styleLoading(elt, val) {  
    if (val) {
      if (elt.hasClass('emotion')) {
        elt.html('<div class="loading-title">Loading</div>');
      } else {
        elt.html(`<div class="loading-title">${i18next.t('loading')}</div>`);
      }
      if (window.lang0 !== window.lang1) {
        elt.addClass('emotion-loading');
      }
    } else {
      elt.removeClass('emotion-loading');
    }

  }

  setTimeout(() => {

    $elm.prevAll().slice(0, numEmotions).each(function(index) {
      $(this).html(prevEmotions[index]);
      styleLoading($(this), false);
    });
  
    $elm_t.nextAll().slice(0, numEmotions).each(function(index) {
      $(this).html(nextEmotions[index]);
      styleLoading($(this), false);
    });

  }, window.loadingDur - 1000);
  
  $elm.add($elm_t).fadeIn(fade_time, function() {
    scrollToEmotion(curEmotion.name, curEmotion.base); // uncomment for scroll

    //transition to color of selected emotion colors
    console.log('setting colors');
    $(this).css('color', emotion_colors[0]);
    $('body').css({background:'-webkit-radial-gradient(' + emotion_colors[0] + ',' + emotion_colors[1] + ')'});
    $('#wrapper_joined').css({background:'-webkit-radial-gradient(' + emotion_colors[0] + ',' + emotion_colors[1] + ')'});
    $('#wrapper_separate').css({background:'-webkit-radial-gradient(' + emotion_colors[0] + ',' + emotion_colors[1] + ')'});
  });
  
  //transition to font color to white
  setTimeout(function() {
    $elm.addClass('selected_emotion');
    $elm_t.addClass('selected_emotion');
  }, fade_time);

}

////////////////// PARSING SELECTION TEXT TO PANELS
function selection_txt_parse(sel_intro_content, panelArray) {
  let sel_intro_sent = sel_intro_content.replace(' ', '\n');
  sel_intro_sent = sel_intro_sent.match(/[^\.!\?]+[\.!\?]+/g);
  let num_sents_panels = Math.ceil(sel_intro_sent.length / num_panels);
  const panels = new Array(Math.ceil(sel_intro_sent.length / num_sents_panels))
    .fill()
    .map(_ => sel_intro_sent.splice(0, num_sents_panels));

  Array.prototype.push.apply(panelArray, panels);

  for (let i = 0; i < panelArray.length; i++) {
    const sentences = panelArray[i];
    for (let j = 0; j < sentences.length; j++) {
      separate_panels[i].firstChild.innerHTML += sentences[j]; 
    }
  }
}

function switchIntroLang() {
  // update panel text
  if (window.introLang === 1) {
    console.log(`introLang in ${window.lang1}`);
    console.log(panelArrayL1);
    for (let i = 0; i < panelArrayL1.length; i++) {
      const sentences = panelArrayL1[i];
      separate_panels[i].firstChild.innerHTML = '';
      for (let j = 0; j < sentences.length; j++) {
        separate_panels[i].firstChild.innerHTML += sentences[j]; 
      }
    }
    // switch language
    window.introLang = 0;
  } else {
    console.log(`introLang in ${window.lang0}`);
    console.log(panelArrayL0);
    for (let i = 0; i < panelArrayL0.length; i++) {
      const sentences = panelArrayL0[i];
      separate_panels[i].firstChild.innerHTML = '';
      for (let j = 0; j < sentences.length; j++) {
        separate_panels[i].firstChild.innerHTML += sentences[j]; 
      }
    }
    window.introLang = 1;
  }
}

////////////////// JOINED MODE
function joinedMode() {
  $('body').addClass('notouch').delay(1000).queue(next => {
    $('body').removeClass('notouch');
    next();
  });

  // reset separate panels
  for (let s in separate_panels) {
    scrollUp(`scroll${s}`, true);
  }

  $('#wrapper_joined').stop(true).fadeIn(fade_time, function() {
    // scrollToEmotion(curEmotion.name, curEmotion.base).then(joinedTimer); // uncomment for scroll
    jumpToEmotion(curEmotion.name, curEmotion.base).then(joinedTimer);
  });
  // $('#wrapper_joined').css('display','flex');
  $('#wrapper_separate').fadeOut(fade_time);
}
// restart auto scrolling, restart hand blink
function joinedTimer() {
  let sec = scroll_timeout;
  let sec_to_idle = idle_timeout;
  clearInterval(timer);
  clearInterval(timer_to_idle);
  timer = setInterval(function() { 
    sec--;
    // console.log('seconds to scroll ' + sec);
    if (sec === -1) {
      console.log('restart autoscroll');
      clearInterval(timer);
      scrollDown('wrapper_joined');
    }
  }, 1000);
  timer_to_idle = setInterval(function() {
    sec_to_idle--;
    console.log('seconds to idle ' + sec_to_idle);
    if (sec_to_idle === -1) {
      clearInterval(timer_to_idle);
      separateMode();
    }
  }, 1000);
}
//stop auto scroll on manual scroll, restart timers
// TODO: will need to change this when we fix the scroll/drag situation
$('#wrapper_joined').on('click wheel DOMMouseScroll mousewheel keyup touchmove', function(e) { 
  console.log(`auto scroll stopped with: ${e.type}`);
  if (e.type !== 'click') {
    $('#wrapper_joined').stop(true); 
    $('#wrapper_joined').clearQueue(); 
  }
  joinedTimer();
  setHandInterval();
});

function scrollDown(id) {
  let el = $(`#${id}`);
  let dur;
  if (id === 'wrapper_joined') {
    dur = (1 - (el.scrollTop() / el[0].scrollHeight)) * scroll_down_time / play_speed;
  } else {

    dur = separate_scroll_times[id.substring(6)] / play_speed;
  }
  el.stop(true).animate({
    scrollTop: el.get(0).scrollHeight - 1920
  }, dur, 'linear', () => {
    setTimeout(() => {
      scrollUp(id);
    }, scroll_pause_time);
  });
}; 

function scrollUp(id, pause) {
  let el = $(`#${id}`);
  let dur;
  if (id === 'wrapper_joined') {
    dur = (el.scrollTop() / el[0].scrollHeight) * scroll_up_time / play_speed;
  } else {
    dur = el.scrollTop() * 0.25 / play_speed;
  }
  el.stop(true).animate({
    scrollTop: 0
  }, dur, 'linear', () => {
    if (!pause) {
      setTimeout(() => {
        scrollDown(id);
      }, scroll_pause_time);
    }
  });
};


////////////////// TRANSITION INTO SEPARATE MODE
function scrollToEmotion(emotion_name, base_emotion) {
  return new Promise(resolve => {
    console.log(emotion_name, base_emotion);
    let scrollVal = calcScrollVal(emotion_name);
    const scrollDiff = Math.abs(scrollVal - $('#wrapper_joined').scrollTop());
    const scrollTime = 0.3 * scrollDiff;
    $('#wrapper_joined').stop(true).animate({
      scrollTop: scrollVal
    }, scrollTime, 'swing', resolve);
    $('#wrapper_joined').css('opacity', 1);
  });
}

// jumps to emotion rather than scrolls
function jumpToEmotion(emotion_name, base_emotion) {
  return new Promise((resolve) => {
    let scrollVal = calcScrollVal(emotion_name);
    $('#wrapper_joined').scrollTop(scrollVal);
    $('#wrapper_joined').css('opacity', 1);
    resolve();
  });
}

function calcScrollVal(emotion_name) {
  const elm = '#option-' + emotion_name;
  const elHeight = $(elm).height() * 0.9;
  const currentPosition = $(elm).offset().top;
  const currentScroll = $('#wrapper_joined').scrollTop();
  let middle = $(window).height() / 2 - 58;
  if (window.lang0 !== window.lang1) middle -= 160;
  const scrollVal = currentScroll + (currentPosition - middle + (elHeight / 2));
  return scrollVal;
}

////////////////// SEPARATE MODE
function separateMode() {
  console.log('ready to be separate');
  switchIntroLang();
  $('#wrapper_joined').stop(true).fadeOut(fade_time);
  $('#wrapper_joined').css('display','none');
  $('#wrapper_separate').stop(true).fadeIn(fade_time);
  $('#wrapper_separate').css('display','flex');
  setTimeout(scrollSeparatePanels, 500);
}

// detect manual scroll
// TODO: determine whether mousemove makes sense here later
$('#wrapper_separate .scroll').on('click wheel DOMMouseScroll mousewheel keyup touchmove mousemove', function(e) {
  console.log(`homescreen stopped: ${e.type}`);
  joinedMode();
}); 

// auto scrolling
function scrollSeparatePanels() {
  for (let s in separate_panels) {
    setTimeout(() => {
      scrollDown(`scroll${s}`);
    }, 0);
  }
}


////////////////// POINTER

// this function restarts 30s timer, called each time there's any interaction
function setHandInterval() {
  if (hand_interval) {
    clearInterval(hand_interval); 
  }
  handIndicator.finish();//.fadeOut(0);
  hand_interval = setInterval(moveHand, hand_delay);
}

function moveHand() {
  // move hand to random position
  const i = Math.floor(Math.random() * num_panels); // ensure hand does not bridge screens
  const panelWidth = $(window).width() / num_panels;
  const nw = i * panelWidth + (Math.random() * (panelWidth - handIndicator.width()));
  
  const h = $(window).height() - handIndicator.height();
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



function testTrigger() {

  let keys = Object.keys(emotions);
  let randEmotion = emotions[keys[ keys.length * Math.random() << 0]];

  console.log(randEmotion);
  socket.emit('emotion:pick', `${randEmotion.name}`);
}
