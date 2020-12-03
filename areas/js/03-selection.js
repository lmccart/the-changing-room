// style and js imports
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



// VARIABLES
const seperate_panel1 = document.getElementById("scroll1");
const seperate_panel2 = document.getElementById("scroll2");
const seperate_panel3 = document.getElementById("scroll3");
const seperate_panel4 = document.getElementById("scroll4");
const sel_txt_url = '/data/03_selection_intro.txt';
const apiURL_emotions = "/emotions";

let sel_intro_content;
let emotions;
let active = false;

function joinedmode() {
  $("#wrapper_joined").fadeIn(1000);
  $("#wrapper_separate").fadeOut(1000);
}
function seperatemode(emotionName) {
  socket.emit('emotion:pick', emotionName);
  $("#wrapper_joined").fadeOut(1000);
  $("#wrapper_separate").fadeIn(1000);
}

//timer for if the panels are not being used, go back to joinedmode
//timer does not start until touched
function resetInterval() {
  clearInterval(timer);
  var timer = setTimeout(function() {
    console.log("restarted interval");
    active = false
    joinedmode()
   }, 7000); 
}
seperate_panel1.onscroll = function (e) {
  // called when the window is scrolled.
  if (active == false) {
    active = true
    resetInterval()
  }
}
seperate_panel2.onscroll = function (e) {
  // called when the window is scrolled.
  if (active == false) {
    active = true
    resetInterval()
  }
}
seperate_panel3.onscroll = function (e) {
  // called when the window is scrolled.
  if (active == false) {
    active = true
    resetInterval()
  }
}
seperate_panel4.onscroll = function (e) {
  // called when the window is scrolled.
  if (active == false) {
    active = true
    resetInterval()
  }
}


// READ IN EMOTION JSON
fetch(apiURL_emotions)
  .then(response => response.json())
  .then(data => { 
    emotions = data;
    for (let emotion in emotions) {
        let $emotion_div = $("<div>", {
          "class": "emotion", 
          text: `${emotion}`,
          "click": function() {
            seperatemode(`${emotion}`)
          }
        });
        $("#scroll_joined").append($emotion_div)
    }
  })

// READ IN SELECTION TEXT
fetch(sel_txt_url)
  .then(response => response.text())
  .then(text => sel_intro_content = text)
  .then(() => selection_txt_parse(sel_intro_content))

// PARSING SELECTION TEXT TO PANELS
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
          if(i == 3) {
            seperate_panel4.firstChild.innerHTML +=  sentences[j]
          }
      }
  }
}

