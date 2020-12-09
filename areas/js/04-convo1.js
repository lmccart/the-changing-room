// style and js imports
import '../css/04-convo1.scss';
import './shared.js';

let emotions;
let curEmotion;
const socket = io();
const typingSpeed = 200; // milliseconds
const pauseOnMessageTime = 6000; // 6s

// elements
const introEl = $('#intro-text');
const chatForm = $('#chat-form');
const chatInput = $('#chat-input');
const chatViewer = $('#chat-viewer');

socket.on('emotion:update', updateEmotion);
socket.on('chat:new', handleNewMessage);

enableAutoTTS();

// set up intro tap listener
introEl.click(() => {
  chatForm.css('display', 'block');
  chatInput.focus();
  introEl.css('display', 'none'); 
});

// set up submit listener
chatForm.submit(function(e){
  e.preventDefault();
  sendMessage();
});

// listen for return key press (13) and send message
$(document).on('keydown', (e) => {
  if(e.which === 13) {
    sendMessage();
  }
});

function sendMessage () {
  const chatText = chatInput.val();
  socket.emit('chat:send', chatText);

  // empty textarea
  chatInput.val('');
}


// sets chat back to initial state
function resetChat () {
  chatForm.css('display', 'none');
  chatViewer.css('display', 'none');
  introEl.css('display', 'block'); 
}

function updateEmotion(msg) {
  if (!curEmotion || curEmotion.name !== msg.name) {
    curEmotion = msg;
    console.log('emotion has been updated to: ' + msg.name + ' (base: ' + msg.base + ', level: ' + msg.level +')');
    // showLoadingOverlay(curEmotion.name);
    updateInterface();
  }
}

function updateInterface() {
  $('#debug-info').text('CURRENT EMOTION: ' + curEmotion.name + ' (base: ' + curEmotion.base + ', level: ' + curEmotion.level +')')
}

function handleNewMessage (newMessage) {
  introEl.css('display', 'none');
  chatForm.css('display', 'none');
  chatViewer.css('display', 'block');

  const speechMessage = new SpeechSynthesisUtterance(newMessage);
  speechSynthesis.speak(speechMessage);
  typeMessageByWord(newMessage);
}

function typeMessageByWord (string, iteration) {
    var iteration = iteration || 0;
    const words = string.split(' ');
    
    // Prevent our code executing if there are no letters left
    if (iteration === words.length) {

        setTimeout(() => { 
          resetChat();
          $('#chat-viewer').empty();
        }, pauseOnMessageTime)
        return;
    }
    
    setTimeout(function() {
        // Set the instruction to the current text + the next character
        // whilst incrementing the iteration variable
        $('#chat-viewer').text( $('#chat-viewer').text() + ' ' + words[iteration++] );
        
        // Re-trigger our function
        typeMessageByWord(string, iteration);
    }, typingSpeed);
}

// function for making sure text to speech is available on iOS Safari
function enableAutoTTS() {
  if (typeof window === 'undefined') {
    return;
  }
  const isiOS = navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform);
  if (!isiOS) {
    return;
  }
  const simulateSpeech = () => {
    const lecture = new SpeechSynthesisUtterance('hello');
    lecture.volume = 0;
    speechSynthesis.speak(lecture);
    document.removeEventListener('click', simulateSpeech);
  };

  document.addEventListener('click', simulateSpeech);
}