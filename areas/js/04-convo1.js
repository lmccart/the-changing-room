// style and js imports
import '../css/04-convo1.scss';
import './shared.js';

let emotions;
let curEmotion = '';
let introPreText = '';
let introPostText = '';
let uiResetTimeout;
let resetWaitTime = 10000 // 10s
const socket = io();
const typingSpeed = 200; // milliseconds
const pauseOnMessageTime = 3000; // 3s

// elements
const introEl = $('#intro-text');
const chatForm = $('#chat-form');
const chatInput = $('#chat-input');
const messageViewerContainer = $('#message-container');
const messageViewer = $('#chat-viewer');

socket.on('emotion:update', updateEmotion);
socket.on('chat:new', handleNewMessage);

// get intro text
fetch('/data/04_chat_intro.txt')
  .then(res => res.blob())
  .then(blob => blob.text())
  .then(text => {
    const text1 = text.split('[');
    const text2 = text.split(']');
    introPreText = text1[0];
    introPostText = text2[1];

    resetChat();
  })

enableAutoTTS();

// set up intro tap listener
introEl.click(() => {
  showChatInput();
});

// set up submit listener
chatForm.submit(function(e){
  e.preventDefault();
  sendMessage();
});

// listen for return key press (13) and send message
$(document).on('keydown', (e) => {
  if(e.which === 13) {
    e.preventDefault();
    sendMessage();
  }
});

// reset the timeout everytime the input changes
chatInput.on('input', () => {
  startResetTimeout();
})

function sendMessage () {
  const chatText = chatInput.val();
  socket.emit('chat:send', chatText);

  // empty textarea
  chatInput.val('');
}

// sets chat back to initial state
function resetChat () {
  console.log('resetting chat');
  chatForm.css('display', 'none');
  chatInput.val('');
  messageViewerContainer.css('display', 'none');
  messageViewer.empty();
  introEl.text(`${introPreText}${curEmotion.name}${introPostText}`);
  introEl.css('display', 'block'); 
}

function startResetTimeout () {
  clearTimeout(uiResetTimeout);
  uiResetTimeout = setTimeout(resetChat, resetWaitTime);
}

function showChatInput () {
  messageViewerContainer.css('display', 'none'); 
  messageViewer.empty();
  introEl.css('display', 'none');
  chatInput.val('');
  chatForm.css('display', 'block');
  chatInput.focus(); 
}

function showMessageViewer () {
  introEl.css('display', 'none');
  chatForm.css('display', 'none');
  messageViewerContainer.css('display', 'block');
}

function updateEmotion(msg) {
  if (!curEmotion || curEmotion.name !== msg.name) {
    curEmotion = msg;
    console.log('emotion has been updated to: ' + msg.name + ' (base: ' + msg.base + ', level: ' + msg.level +')');
    updateInterface();
  }
}

function updateInterface() {
  resetChat();
  $('#debug-info').text('CURRENT EMOTION: ' + curEmotion.name + ' (base: ' + curEmotion.base + ', level: ' + curEmotion.level +')')
}

function handleNewMessage (newMessage) {
  showMessageViewer();

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
          showChatInput();
        }, pauseOnMessageTime)
        return;
    }
    
    setTimeout(function() {
        // Set the instruction to the current text + the next character
        // whilst incrementing the iteration variable
        messageViewer.text( messageViewer.text() + ' ' + words[iteration++] );
        messageViewer.animate({ scrollTop: messageViewer[0].scrollHeight}, 1);
        startResetTimeout();
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