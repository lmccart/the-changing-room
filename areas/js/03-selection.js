// style and js imports
import '../css/03-selection.scss';
import './shared.js';

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




var apiURL_emotions = "/emotions";

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

var seperate_panel1 = document.getElementById("scroll1")
var seperate_panel2 = document.getElementById("scroll2")
var active = false
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

