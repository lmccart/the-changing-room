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
const seperate_panel1 = document.getElementById("scroll1");
const seperate_panel2 = document.getElementById("scroll2");
const seperate_panel3 = document.getElementById("scroll3");
const handIndicator = $('#hand-indicator');
const sel_txt_url = '/data/03_selection_intro.txt';
const apiURL_emotions = "/emotions";
const wrapper_joined = $("#wrapper_joined")
const num_sents_panels = 3;
let sel_intro_content;
let emotions;
let timer;
let timer_to_idle;


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
  const panel_array = new Array(Math.ceil(sel_intro_sent.length / num_sents_panels))
    .fill()
    .map(_ => sel_intro_sent.splice(0, num_sents_panels))
  for(var i = 0; i < panel_array.length; i++) {
      var sentences = panel_array[i];
      for(var j = 0; j < sentences.length; j++) {
          if(i == 0) {
            seperate_panel1.firstChild.innerHTML +=  sentences[j]
          }
          if(i == 1) {
            seperate_panel2.firstChild.innerHTML +=  sentences[j]
          }
          if(i == 2) {
            seperate_panel3.firstChild.innerHTML +=  sentences[j]
          }
      }
  }
}



////////////////// JOINED MODE
function joinedmode() {
  $("#wrapper_joined").fadeIn(2000);
  $("#wrapper_joined").css("display","flex");
  $("#wrapper_separate").fadeOut(1000);
  scrollDown(wrapper_joined);
}
//restart auto scrolling after 4 seconds
function joinedTimer() {
    let sec = 8;
    let sec_to_idle = 30;
    clearInterval(timer);
    clearInterval(timer_to_idle);
    timer = setInterval(function() { 
      sec--;
      console.log(sec)
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
        seperatemode()
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
  }, 990000, 'linear', function() {
      scrollUp(el)
  });
}; 
// auto scroll up
function scrollUp(el) {
  el.animate({
      scrollTop: 0
  }, 9000, function() {
      scrollDown(el);
  });
};




////////////////// TRANSITION INTO SEPERATE MODE
function clickedmode(elm, emotionName, base_emotion) {
  socket.emit('emotion:pick', emotionName);
  $(".emotion").removeAttr( 'style' );
  $(".emotion").removeClass("selected_emotion");
  //get color of selected emotion colors
  let emotion_colors = baseColors[base_emotion]
  let emotion_colors_str1 = "#"+emotion_colors[0][0]
  let emotion_colors_str2 = "#"+emotion_colors[0][1]
  $(elm).fadeIn("1000", function() {
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
    $("#wrapper_joined").css({background:"-webkit-radial-gradient(" + emotion_colors_str1 + "," + emotion_colors_str2 + ")"});
    $("#wrapper_separate").css("background","-webkit-radial-gradient(" + emotion_colors_str1 + "," + emotion_colors_str2 + ")");
  });
  //transition to font color to white
  setTimeout(function() {
      $(elm).fadeIn("slow", function() {
        $(this).addClass("selected_emotion")
      });
  }, 1000);
}

////////////////// SEPERATE MODE
function seperatemode() {
  $("#wrapper_joined").fadeOut(1000);
  $("#wrapper_joined").css("display","none");
  $("#wrapper_separate").fadeIn(1000);
  $("#wrapper_separate").css("display","flex");
  scroll_seperate_panels()
}

// detect manual scroll
$(seperate_panel1).on("click wheel DOMMouseScroll mousewheel keyup touchmove", function(){
  joinedmode()
})
$(seperate_panel2).on("click wheel DOMMouseScroll mousewheel keyup touchmove", function(){
  joinedmode()
})
$(seperate_panel3).on("click wheel DOMMouseScroll mousewheel keyup touchmove", function(){
  joinedmode()
})

// auto scrolling
function scroll_seperate_panels() {
  setTimeout(function() {
      scrollDown($("#scroll1"))
    setTimeout(function() {
      scrollDown($("#scroll2"))
    }, 1500);
    setTimeout(function() {
      scrollDown($("#scroll3"))
    }, 3000);
  }, 0);
}

//initial pause for screen load
setTimeout(function() {
  joinedmode()
}, 2000);

setInterval(() => {
  moveHand()
}, 30000);



////////////////// POINTER
function moveHand() {
  // move hand to random position
  var h = $(window).height() - handIndicator.height();
  var w = $(window).width() - handIndicator.width();
  var nh = Math.floor(Math.random() * h);
  var nw = Math.floor(Math.random() * w);
  handIndicator.css({top: `${nh}px`, left: `${nw}px`})
  // then show hand
  handIndicator
    .fadeIn(1000)
    .fadeOut(1000)
    .fadeIn(1000)
    .fadeOut(1000)
    .fadeIn(1000)
    .fadeOut(1000)
    .fadeIn(1000)
    .fadeOut(1000);
}