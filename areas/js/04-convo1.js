// style and js imports
import $ from 'jquery';
import { getTextColorForBackground } from './lib/imageColorUtils.js';
import '../css/04-convo1.scss';
import './shared.js';

let emotions;
let curEmotion = '';
let introText = '';
let uiResetTimeout;
let resetWaitTime = 30 * 1000
let socketid;
const socket = io();
const typingSpeed = 200; // milliseconds
const pauseOnMessageTime = 3000; // 3s

// elements
const introEl = $('#intro-text');
const chatForm = $('#chat-form');
const chatInput = $('#chat-input');
const messageViewerContainer = $('#message-container');
const messageViewer = $('#chat-viewer');


socket.on('connect', function() { socketid = socket.id; });
socket.on('emotion:update', updateEmotion);
socket.on('chat:new', handleNewMessage);

// get intro text
fetch('/data/04_convo1_intro.txt')
  .then(res => res.blob())
  .then(blob => blob.text())
  .then(text => {
    introText = text
    resetChat();
  });

enableAutoTTS();

// set up intro tap listener
introEl.on('click', showChatInput);

// set up submit listener
chatForm.submit(sendMessage);

// listen for return key press (13) and send message
$(document).on('keydown', (e) => {
  if(e.which === 13) {
    sendMessage(e);
  }
});

chatInput.on('focus', () => { $('#chat-submit').addClass('focused'); })
// reset the timeout everytime the input changes
chatInput.on('change', startResetTimeout)

function sendMessage(e) {
  e.preventDefault();
  const chatText = chatInput.val();
  if (chatText.length) {
    socket.emit('chat:send', {original: chatText, id: socketid});
    chatInput.val('');
    chatInput.trigger('blur');
    $('#chat-submit').removeClass('focused');
  }
}

// sets chat back to initial state
function resetChat() {
  console.log('resetting chat');
  chatForm.hide();
  chatInput.val('');
  messageViewerContainer.hide();
  messageViewer.empty();
  introEl.text(introText);
  introEl.show(); 
}

function startResetTimeout() {
  clearTimeout(uiResetTimeout);
  uiResetTimeout = setTimeout(resetChat, resetWaitTime);
}

function showChatInput() {
  messageViewerContainer.hide(); 
  messageViewer.empty();
  introEl.hide();
  chatInput.val('');
  chatForm.show();
  chatInput.trigger('focus'); // this doesn't work on iPad, unless triggered by click
}

function showMessageViewer() {
  introEl.hide();
  chatForm.hide();
  chatInput.trigger('blur'); // this doesn't work on iPad
  messageViewerContainer.show();
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
  const colors = window.baseColors[curEmotion.base][curEmotion.level-1];
  const textColor = getTextColorForBackground(colors[1]);
  $('body').css('color', textColor);
  $('body').css('background', `radial-gradient(#${colors[0]},#${colors[1]})`);
  $('#debug-info').text(screen.width+' '+screen.height);//CURRENT EMOTION: ' + curEmotion.name + ' (base: ' + curEmotion.base + ', level: ' + curEmotion.level +')')
}

function handleNewMessage(data) {
  showMessageViewer();
  if (data.id !== socketid) { // only show modified to partner
    const speechMessage = new SpeechSynthesisUtterance(data.modified);
    speechSynthesis.speak(speechMessage);
    typeMessageByWord(data.modified);
  } else {
    typeMessageByWord(data.original);
  }
}

function typeMessageByWord(string, iteration) {
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