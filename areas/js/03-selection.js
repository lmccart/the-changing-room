// style and js imports
import $ from 'jquery';
import '../css/03-selection.scss';
import './shared.js';

// VARIABLES
const num_panels = 4; 
let idle_timeout = 10;
let scroll_timeout = 3;
let scroll_down_time = 990000;
let scroll_up_time = 9000;
let hand_blink_time = 700;
let hand_delay = 30000;
let fade_time = 1000;

let curEmotion;

const separate_panels = [];
for (let i = 0; i < num_panels; i++) {
  separate_panels.push(document.getElementById('scroll' + i)); 
}

const handIndicator = $('#hand-indicator');
const sel_txt_url = '/data/03_selection_intro.txt';
const apiURL_emotions = '/emotions';
let sel_intro_content;
let emotions;

let timer;
let timer_to_idle;
let hand_interval;

window.init = () => {
  //READ IN EMOTION JSON
  fetch(apiURL_emotions)
    .then(response => response.json())
    .then(data => { 
      emotions = data;
      console.log(emotions);

      Object.keys(emotions)
        .sort()
        .forEach(function(emotion, i) {
          let base_emotion = emotions[emotion].base;
          let emotion_div = $('<div>', {
            'id': `option-${emotion}`,
            'class': 'emotion', 
            text: `${emotion}`,
            'click': function() {
              socket.emit('emotion:pick', `${emotion}`);
            }
          });
          $('#scroll_joined').append(emotion_div);
        });
      socket.on('emotion:update', updateEmotion);
      socket.emit('emotion:get');
      separatemode();
      setHandInterval();
    });

  // READ IN SELECTION TEXT
  fetch(sel_txt_url)
    .then(response => response.text())
    .then(text => sel_intro_content = text)
    .then(() => selection_txt_parse(sel_intro_content));

  $('#wrapper_separate').hide();
};

function updateEmotion(msg) {
  console.log('update emotion');
  console.log(msg);
  if (!curEmotion || curEmotion.name !== msg.name) {
    curEmotion = msg;
    console.log('emotion has been updated to: ' + msg.name + ' (base: ' + msg.base + ', level: ' + msg.level + ')');
    updateInterface();
  }
}

function updateInterface() {
  $('#debug-info').text('CURRENT EMOTION: ' + curEmotion.name + ' (base: ' + curEmotion.base + ', level: ' + curEmotion.level + ')');
  $('#emotions').val(curEmotion.name);

  $('.emotion').removeAttr('style');
  $('.emotion').removeClass('selected_emotion');
  //get color of selected emotion colors
  let emotion_colors = baseColors[curEmotion.base];
  let emotion_colors_str1 = '#' + emotion_colors[0][0];
  let emotion_colors_str2 = '#' + emotion_colors[0][1];

  const elm = '#option-' + curEmotion.name;
  $(elm).fadeIn(fade_time, function() {
    scrollToEmotion(curEmotion.name, curEmotion.base);

    //transition to color of selected emotion colors
    console.log('setting colors');
    $(this).css('color', emotion_colors_str1);
    $('body').css({background:'-webkit-radial-gradient(' + emotion_colors_str1 + ',' + emotion_colors_str2 + ')'});
    $('#wrapper_joined').css({background:'-webkit-radial-gradient(' + emotion_colors_str1 + ',' + emotion_colors_str2 + ')'});
    $('#wrapper_separate').css({background:'-webkit-radial-gradient(' + emotion_colors_str1 + ',' + emotion_colors_str2 + ')'});
  });
  
  //transition to font color to white
  setTimeout(function() {
    $(elm).addClass('selected_emotion');
  }, fade_time);
}

////////////////// PARSING SELECTION TEXT TO PANELS
function selection_txt_parse(sel_intro_content) {
  let sel_intro_sent = sel_intro_content.match(/[^\.!\?]+[\.!\?]+/g);
  let num_sents_panels = Math.ceil(sel_intro_sent.length / num_panels);
  const panel_array = new Array(Math.ceil(sel_intro_sent.length / num_sents_panels))
    .fill()
    .map(_ => sel_intro_sent.splice(0, num_sents_panels));
  for (let i = 0; i < panel_array.length; i++) {
    const sentences = panel_array[i];
    for (let j = 0; j < sentences.length; j++) {
      separate_panels[i].firstChild.innerHTML += sentences[j]; 
    }
    
  }
}

////////////////// JOINED MODE
function joinedmode() {
  $('#wrapper_joined').stop().fadeIn(fade_time, function() {
    scrollToEmotion(curEmotion.name, curEmotion.base);
  });
  // $('#wrapper_joined').css('display','flex');
  $('#wrapper_separate').fadeOut(fade_time);
  joinedTimer();
}
// restart auto scrolling, restart hand blink
function joinedTimer() {
  let sec = scroll_timeout;
  let sec_to_idle = idle_timeout;
  clearInterval(timer);
  clearInterval(timer_to_idle);
  timer = setInterval(function() { 
    sec--;
    console.log('seconds to scroll ' + sec);
    if (sec === -1) {
      console.log('restart autoscroll');
      clearInterval(timer);
      scrollDown($('#wrapper_joined'));
    }
  }, 1000);
  timer_to_idle = setInterval(function() {
    sec_to_idle--;
    console.log('seconds to idle ' + sec_to_idle);
    if (sec_to_idle === -1) {
      clearInterval(timer_to_idle);
      separatemode();
    }
  }, 1000);
}
//stop auto scroll on manual scroll, restart timers
$('#wrapper_joined').on('click wheel DOMMouseScroll mousewheel keyup touchmove', function(e) {
  if (e.type !== 'click') {
    $('#wrapper_joined').stop(); 
  }
  joinedTimer();
  setHandInterval();
});

function scrollDown(el, scroll_dur) {
  let dur = scroll_dur || scroll_down_time;
  el.animate({
    scrollTop: el.get(0).scrollHeight
  }, dur, 'linear', function() {
    scrollUp(el, scroll_dur);
  });
}; 

function scrollUp(el, scroll_dur) {
  let dur = scroll_dur || scroll_up_time;
  el.animate({
    scrollTop: 0
  }, dur, function() {
    scrollDown(el, scroll_dur);
  });
};


////////////////// TRANSITION INTO SEPARATE MODE
function scrollToEmotion(emotion_name, base_emotion) {
  console.log(emotion_name, base_emotion);
  const elm = '#option-' + emotion_name;
  const elHeight = $(elm).height() * 0.9;
  const currentPosition = $(elm).offset().top;
  const currentScroll = $('#wrapper_joined').scrollTop();
  const middle = $(window).height() / 2;
  const scrollVal = currentScroll + (currentPosition - middle + (elHeight / 2));
  console.log(currentScroll, currentPosition, scrollVal);
  $('#wrapper_joined').stop().animate({
    scrollTop: scrollVal
  }, 2000, 'linear');
}

////////////////// SEPARATE MODE
function separatemode() {
  $('#wrapper_joined').stop().fadeOut(fade_time);
  $('#wrapper_joined').css('display','none');
  $('#wrapper_separate').stop().fadeIn(fade_time);
  $('#wrapper_separate').css('display','flex');
  setTimeout(function() {
    scroll_separate_panels();
  }, 500);
}

// detect manual scroll
$('#wrapper_separate .scroll').on('click wheel DOMMouseScroll mousewheel keyup touchmove', joinedmode);

// auto scrolling
function scroll_separate_panels() {
  setTimeout(function() {
    scrollDown($('#scroll0'), 3000);
  }, 0);
  setTimeout(function() {
    scrollDown($('#scroll1'), 13000);
  }, 0);
  setTimeout(function() {
    scrollDown($('#scroll2'), 20000);
  }, 1500);
  setTimeout(function() {
    scrollDown($('#scroll3'), 18000);
  }, 3100);  
}


////////////////// POINTER

// this function restarts 30s timer, called each time there's any interaction
function setHandInterval() {
  if (hand_interval) {
    clearInterval(hand_interval); 
  }
  handIndicator.finish().fadeOut(0);
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
    .delay(hand_blink_time)
    .fadeOut(0);
}


//     ___    ___     ___              ___     ___     ___    _   _    ___           
//    | __|  / _ \   | _ \     o O O  |   \   | __|   | _ )  | | | |  / __|          
//    | _|  | (_) |  |   /    o       | |) |  | _|    | _ \  | |_| | | (_ |          
//   _|_|_   \___/   |_|_\   TS__[O]  |___/   |___|   |___/   \___/   \___|          
// _| ''' |_|'''''|_|'''''| {======|_|'''''|_|'''''|_|'''''|_|'''''|_|'''''|         
// '`-0-0-''`-0-0-''`-0-0-'./o--000''`-0-0-''`-0-0-''`-0-0-''`-0-0-''`-0-0-'         
//     ___    _       ___              ___     ___   __  __    ___   __   __   ___   
//    | _ \  | |     / __|     o O O  | _ \   | __| |  \/  |  / _ \  \ \ / /  | __|  
//    |  _/  | |__   \__ \    o       |   /   | _|  | |\/| | | (_) |  \ V /   | _|   
//   _|_|_   |____|  |___/   TS__[O]  |_|_\   |___| |_|__|_|  \___/   _\_/_   |___|  
// _| ''' |_|'''''|_|'''''| {======|_|'''''|_|'''''|_|'''''|_|'''''|_| ''''|_|'''''| 
// '`-0-0-''`-0-0-''`-0-0-'./o--000''`-0-0-''`-0-0-''`-0-0-''`-0-0-''`-0-0-''`-0-0-' 
// 

// $('#emotions').change(pickEmotion);

// $.getJSON('/emotions', (data) => {
//   console.log(data);
//   populatePicker(data);
// });

// function populatePicker(data) {
//   for (let item in data) {
//     $('#emotions').append($('<option>', {
//       value: item,
//       text: item
//     }));
//   }
// }

// function pickEmotion() {
//   let emotionName = $('#emotions').val();
//   socket.emit('emotion:pick', emotionName);
// }

// 
//    ___    _  _     ___              ___     ___     ___    _   _    ___   
//   | __|  | \| |   |   \     o O O  |   \   | __|   | _ )  | | | |  / __|  
//   | _|   | .` |   | |) |   o       | |) |  | _|    | _ \  | |_| | | (_ |  
//   |___|  |_|\_|   |___/   TS__[O]  |___/   |___|   |___/   \___/   \___|  
// _|'''''|_|'''''|_|'''''| {======|_|'''''|_|'''''|_|'''''|_|'''''|_|'''''| 
// '`-0-0-''`-0-0-''`-0-0-'./o--000''`-0-0-''`-0-0-''`-0-0-''`-0-0-''`-0-0-' 
// 
