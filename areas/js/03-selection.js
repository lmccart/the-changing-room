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

$('#emotions').change(pickEmotion);

$.getJSON('/emotions', (data) => {
  console.log(data);
  populatePicker(data);
});

function populatePicker(data) {
  for (let item in data) {
    $('#emotions').append($('<option>', {
      value: item,
      text: item
    }));
  }
}

function pickEmotion() {
  let emotionName = $('#emotions').val();
  socket.emit('emotion:pick', emotionName);
}

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
const sel_txt_url = '/data/03_selection_intro.txt';
const apiURL_emotions = "/emotions";
let sel_intro_content;
let emotions;
let active = false;

////////////////// MODES
function joinedmode() {
  $("#wrapper_joined").fadeIn(1000);
  $("#wrapper_separate").fadeOut(1000);
}
function seperatemode(elm, emotionName, base_emotion) {
  socket.emit('emotion:pick', emotionName);
  $(".emotion").removeAttr( 'style' );
  $(".emotion").removeClass("selected_emotion");
  //transition to font color to selected emotion colors
  let emotion_colors = baseColors[base_emotion]
  let emotion_colors_str1 = "#"+emotion_colors[0][0]
  let emotion_colors_str2 = "#"+emotion_colors[0][1]
  $(elm).fadeIn("10000", function() {
    $(this).css("color", emotion_colors_str1);
    $("#wrapper_joined").css({background:"-webkit-radial-gradient(" + emotion_colors_str1 + "," + emotion_colors_str2 + ")"});
  });
  //transition to font color to white
  setTimeout(function() {
      $(elm).fadeIn("slow", function() {
        $(this).addClass("selected_emotion")
      });
      //start auto scroll
      scroll_panels();
  }, 5100);
  setTimeout(function() {
    $("#wrapper_joined").fadeOut(1000);
    $("#wrapper_separate").css("display","flex");
    //scroll to top (NOT WORKING) ---------------------------------
    $("#scroll1 .scroll_text").scrollTop(0);
    $("#scroll2").scrollTop(0);
    $("#scroll3").scrollTop(0);
    $("#wrapper_separate").fadeIn(1000);
    $("#wrapper_separate").css("background","-webkit-radial-gradient(" + emotion_colors_str1 + "," + emotion_colors_str2 + ")");
  }, 6000);
}


////////////////// READ IN EMOTION JSON
fetch(apiURL_emotions)
  .then(response => response.json())
  .then(data => { 
    emotions = data;
    for (let emotion in emotions) {
        let base_emotion = emotions[emotion].base
        let $emotion_div = $("<div>", {
          "class": "emotion", 
          text: `${emotion}`,
          "click": function() {
            seperatemode(this,`${emotion}`, base_emotion)
          }
        });
        $("#scroll_joined").append($emotion_div)
    }
  })
////////////////// READ IN SELECTION TEXT
fetch(sel_txt_url)
  .then(response => response.text())
  .then(text => sel_intro_content = text)
  .then(() => selection_txt_parse(sel_intro_content))


////////////////// PARSING SELECTION TEXT TO PANELS
const num_sents_panels = 3;
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



////////////////// SCROLLING
//timer starts when panel1 reaches bottom, go back to joinedmode
function resetInterval() {
  clearInterval(timer);
  var timer = setTimeout(function() {
    console.log("restarted interval");
    active = false
    joinedmode()
   }, 9000); 
}

$("#wrapper_separate .scroll").scroll(function(e) {
  if ($(this).is(':animated')) {
      console.log('scroll happen by animate');
  } else if (e.originalEvent) {
      // scroll happen manual scroll
      // console.log('scroll happen manual scroll');
      const elm = "#"+e["currentTarget"]["id"]
      $(elm).animate({scrollTop: $(".scroll").prop("scrollHeight")}, 600000, 'linear');
      $("html, body").stop()
  } else {
      // scroll happen by call
      console.log('scroll happen by call');
  }
});

//stop auto scroll
$(seperate_panel1).on("mousedown wheel DOMMouseScroll mousewheel keyup touchmove", function(){
     $(seperate_panel1).stop();
})
$(seperate_panel2).on("mousedown wheel DOMMouseScroll mousewheel keyup touchmove", function(){
     $(seperate_panel2).stop();
})
$(seperate_panel3).on("mousedown wheel DOMMouseScroll mousewheel keyup touchmove", function(){
     $(seperate_panel3).stop();
})

// auto scrolling
function scroll_panels() {
  setTimeout(function() {
    $("#scroll1").animate({scrollTop: 9086}, 600000, 'linear');
    setTimeout(function() {
      $("#scroll2").animate({scrollTop: 9086}, 600000, 'linear');
    }, 1500);
    setTimeout(function() {
      $("#scroll3").animate({scrollTop: 9086}, 650000, 'linear');
    }, 3000);
    //when panel 2 reaches bottom
    $(function($) {
        $(seperate_panel2).on('scroll', function() {
            if($(this).scrollTop() + $(this).innerHeight() >= $(this)[0].scrollHeight) {
              resetInterval()
            }
        })
    });
  }, 0);
}


joinedmode()
