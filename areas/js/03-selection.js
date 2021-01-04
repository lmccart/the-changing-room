// style and js imports
import $ from 'jquery';
import '../css/03-selection.scss';
import './shared.js';

// EMOTION HANDLING
let curEmotion;
const socket = io();
socket.on('emotion:update', updateEmotion);

function updateEmotion(msg) {
  console.log(msg)
  if (!curEmotion || curEmotion.name !== msg.name) {
    curEmotion = msg;

    // clickedmode(this,`${curEmotion}`, curEmotion.base)
    console.log('emotion has been updated to: ' + msg.name + ' (base: ' + msg.base + ', level: ' + msg.level +')');
    updateInterface();
  }
}

function updateInterface() {
  $('#debug-info').text('CURRENT EMOTION: ' + curEmotion.name + ' (base: ' + curEmotion.base + ', level: ' + curEmotion.level +')')
  $('#emotions').val(curEmotion.name);
}

//     ___    ___     ___              ___     ___     ___    _   _    ___           
//    | __|  / _ \   | _ \     o O O  |   \   | __|   | _ )  | | | |  / __|          
//    | _|  | (_) |  |   /    o       | |) |  | _|    | _ \  | |_| | | (_ |          
//   _|_|_   \___/   |_|_\   TS__[O]  |___/   |___|   |___/   \___/   \___|          
// _| """ |_|"""""|_|"""""| {======|_|"""""|_|"""""|_|"""""|_|"""""|_|"""""|         
// "`-0-0-'"`-0-0-'"`-0-0-'./o--000'"`-0-0-'"`-0-0-'"`-0-0-'"`-0-0-'"`-0-0-'         
//     ___    _       ___              ___     ___   __  __    ___   __   __   ___   
//    | _ \  | |     / __|     o O O  | _ \   | __| |  \/  |  / _ \  \ \ / /  | __|  
//    |  _/  | |__   \__ \    o       |   /   | _|  | |\/| | | (_) |  \ V /   | _|   
//   _|_|_   |____|  |___/   TS__[O]  |_|_\   |___| |_|__|_|  \___/   _\_/_   |___|  
// _| """ |_|"""""|_|"""""| {======|_|"""""|_|"""""|_|"""""|_|"""""|_| """"|_|"""""| 
// "`-0-0-'"`-0-0-'"`-0-0-'./o--000'"`-0-0-'"`-0-0-'"`-0-0-'"`-0-0-'"`-0-0-'"`-0-0-' 
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
// _|"""""|_|"""""|_|"""""| {======|_|"""""|_|"""""|_|"""""|_|"""""|_|"""""| 
// "`-0-0-'"`-0-0-'"`-0-0-'./o--000'"`-0-0-'"`-0-0-'"`-0-0-'"`-0-0-'"`-0-0-' 
// 

// VARIABLES
const num_panels = 4;
const separate_panels = [];
for (let i=0; i<num_panels; i++) {
  separate_panels.push(document.getElementById("scroll"+i));
}

const handIndicator = $('#hand-indicator');
const sel_txt_url = '/data/03_selection_intro.txt';
const apiURL_emotions = "/emotions";
const wrapper_joined = $("#wrapper_joined")
let sel_intro_content;
let emotions;
let timer;
let timer_to_idle;
let idle_timeout = 10;
let scroll_timeout = 8;
let scroll_down_time = 990000;
let scroll_up_time = 9000;
let hand_blink_time = 700;
let hand_delay = 30000;
let fade_time = 1000;

////////////////// READ IN EMOTION JSON
fetch(apiURL_emotions)
  .then(response => response.json())
  .then(data => { 
    emotions = data;
    for (let emotion in emotions) {
      let base_emotion = emotions[emotion].base
      let emotion_div = $("<div>", {
        "class": "emotion", 
        text: `${emotion}`,
        "click": function() {
          clickedmode(this,`${emotion}`, base_emotion)
        }
      });
      $("#scroll_joined").append(emotion_div)
    }
  })
////////////////// READ IN SELECTION TEXT
fetch(sel_txt_url)
  .then(response => response.text())
  .then(text => sel_intro_content = text)
  .then(() => selection_txt_parse(sel_intro_content))
////////////////// PARSING SELECTION TEXT TO PANELS
function selection_txt_parse(sel_intro_content) {
  let sel_intro_sent = sel_intro_content.match( /[^\.!\?]+[\.!\?]+/g );
  let num_sents_panels = Math.ceil(sel_intro_sent.length / num_panels);
  const panel_array = new Array(Math.ceil(sel_intro_sent.length / num_sents_panels))
    .fill()
    .map(_ => sel_intro_sent.splice(0, num_sents_panels))
  for(var i = 0; i < panel_array.length; i++) {
      var sentences = panel_array[i];
      for(let j = 0; j < sentences.length; j++) {
        separate_panels[i].firstChild.innerHTML += sentences[j];
      }
  }
}



////////////////// JOINED MODE
function joinedmode() {
  $("#wrapper_joined").fadeIn(fade_time);
  $("#wrapper_joined").css("display","flex");
  $("#wrapper_separate").fadeOut(fade_time);
  scrollDown(wrapper_joined);
}
//restart auto scrolling after 4 seconds
function joinedTimer() {
  let sec = scroll_timeout;
  let sec_to_idle = idle_timeout;
  clearInterval(timer);
  clearInterval(timer_to_idle);
  timer = setInterval(function() { 
    sec--;
    console.log("seconds to scroll" + sec)
    if (sec == -1) {
      console.log("restart autoscroll")
      clearInterval(timer);
      scrollDown(wrapper_joined)
    }
  }, 500);
  timer_to_idle = setInterval(function() {
    sec_to_idle--;
    console.log("seconds to idle" + sec_to_idle)
    if (sec_to_idle == -1) {
      clearInterval(timer_to_idle);
      separatemode()
    }
  }, 500);
}
//stop auto scroll on manual scroll
$("#wrapper_joined").on("click wheel DOMMouseScroll mousewheel keyup touchmove", function(){
  $("#wrapper_joined").stop();
  joinedTimer()
})
// auto scroll down
function scrollDown(el) {
  let scrollBottom = el.prop("scrollHeight")
  el.animate({
    scrollTop: el.get(0).scrollHeight
  }, scroll_down_time, 'linear', function() {
    scrollUp(el)
  });
}; 
function scrollDown_separate(el, num) {
  el.animate({
    scrollTop: num
  }, scroll_down_time, 'linear', function() {
    scrollUp(el)
  });
}; 
// auto scroll up
function scrollUp(el) {
  el.animate({
    scrollTop: 0
  }, scroll_up_time, function() {
    scrollDown(el);
  });
};




////////////////// TRANSITION INTO SEPARATE MODE
function clickedmode(elm, emotionName, base_emotion) {
  socket.emit('emotion:pick', emotionName);
  $(".emotion").removeAttr( 'style' );
  $(".emotion").removeClass("selected_emotion");
  //get color of selected emotion colors
  let emotion_colors = baseColors[base_emotion]
  let emotion_colors_str1 = "#"+emotion_colors[0][0]
  let emotion_colors_str2 = "#"+emotion_colors[0][1]
  $(elm).fadeIn(fade_time, function() {
    //scroll emotion to center of screen
    const elHeight = $(elm).height();
    const currentPosition = $(elm).offset().top;
    const currentScroll = wrapper_joined.scrollTop();
    const middle = $(window).height() / 2;
    const scrollVal = currentScroll + (currentPosition - middle + (elHeight / 2));
    console.log(scrollVal)
    wrapper_joined.animate({
      scrollTop: scrollVal
    }, 2000, 'linear');
    //transition to color of selected emotion colors
    $(this).css("color", emotion_colors_str1);
    $("body").css({background:"-webkit-radial-gradient(" + emotion_colors_str1 + "," + emotion_colors_str2 + ")"});
    $("#wrapper_joined").css({background:"-webkit-radial-gradient(" + emotion_colors_str1 + "," + emotion_colors_str2 + ")"});
    $("#wrapper_separate").css("background","-webkit-radial-gradient(" + emotion_colors_str1 + "," + emotion_colors_str2 + ")");
  });
  //transition to font color to white
  setTimeout(function() {
    $(elm).fadeIn(fade_time, function() {
      $(this).addClass("selected_emotion")
    });
  }, fade_time);
}

////////////////// SEPARATE MODE
function separatemode() {
  $("#wrapper_joined").fadeOut(fade_time);
  $("#wrapper_joined").css("display","none");
  $("#wrapper_separate").fadeIn(fade_time);
  $("#wrapper_separate").css("display","flex");
  scroll_separate_panels()
}

// detect manual scroll
$('#wrapper_separate .scroll').on("click wheel DOMMouseScroll mousewheel keyup touchmove", joinedmode);

// auto scrolling
function scroll_separate_panels() {
  setTimeout(function() {
    scrollDown_separate($("#scroll0"), 13000);
  }, 0);
  setTimeout(function() {
    scrollDown_separate($("#scroll1"), 13000);
  }, 0);
  setTimeout(function() {
    scrollDown_separate($("#scroll2"), 20000);
  }, 1500);
  setTimeout(function() {
    scrollDown_separate($("#scroll3"), 18000);
  }, 3100);  
}

//initial pause for screen load
setTimeout(joinedmode, 2000);

setInterval(moveHand, hand_delay);


////////////////// POINTER
function moveHand() {
  // move hand to random position
  const i = Math.floor(Math.random()*num_panels); // ensure hand does not bridge screens
  const panelWidth = $(window).width()/num_panels;
  const nw = i * panelWidth + (Math.random() * (panelWidth - handIndicator.width()));
  
  const h = $(window).height() - handIndicator.height();
  const nh = Math.floor(Math.random() * h);
  
  handIndicator.css({top: `${nh}px`, left: `${nw}px`})
  // then show hand
  handIndicator
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
    .fadeOut(0)
}