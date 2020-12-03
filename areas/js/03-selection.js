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


// VUE
const apiURL_emotions = "/emotions";
var app;
app = new Vue({
  el: "#app",
  data: {
    emotions: null,
    selection_txt: null,
  },
  created: function() {
    this.fetchEmotions();
    // this.fetchSelectionTxt();
  },
  methods: {
    fetchEmotions: function() {
      fetch(apiURL_emotions)
        .then(response => response.json())
        .then(data => { this.emotions = data })
    },
    joinedmode: function() {
      $("#wrapper_joined").fadeIn(1000);
      $("#wrapper_separate").fadeOut(1000);
    },
    separatemode: function(emotionName) {
      socket.emit('emotion:pick', emotionName);
      $("#wrapper_joined").fadeOut(1000);
      $("#wrapper_separate").fadeIn(1000);
    }
  }
});


// VARIABLES
const seperate_panel1 = document.getElementById("scroll1");
const seperate_panel2 = document.getElementById("scroll2");
const seperate_panel3 = document.getElementById("scroll3");
const seperate_panel4 = document.getElementById("scroll4");
const sel_txt_url = 'data/03_selection_intro.txt';

let sel_intro_content;
let active = false;

//timer for if the panels are not being used, go back to joinedmode
//timer does not start until touched
function resetInterval() {
  clearInterval(timer);
  var timer = setTimeout(function() {
    console.log("restarted interval");
    active = false
    app.joinedmode()
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




fetch(sel_txt_url)
  .then(response => response.text())
  .then(text => sel_intro_content = text)
  .then(() => selection_txt_parse(sel_intro_content))


const num_sents_panels = 3;
function selection_txt_parse(sel_intro_content) {
  let sel_intro_sent = sel_intro_content.match( /[^\.!\?]+[\.!\?]+/g );
  const panel_array = new Array(Math.ceil(sel_intro_sent.length / num_sents_panels))
    .fill()
    .map(_ => sel_intro_sent.splice(0, num_sents_panels))
  console.log(panel_array)
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

