import $ from 'jquery';
import { getTextColorForBackground } from './lib/imageColorUtils.js';
import '../css/04-convo1.scss';
import './shared.js';

let curEmotion = '';
let introText = '';
let uiResetTimeout;
let resetWaitTime = 30 * 1000;
let socketid;
let selectedVoiceIndex = 9999;
let selectedVoice;
const typingSpeed = 200; // milliseconds
const pauseOnMessageTime = 2000; // 3s

// elements
const introEl = $('#intro-text');
const chatForm = $('#chat-form');
const chatInput = $('#chat-input');
const chatSubmit = $('#chat-submit');
const messageViewerContainer = $('#message-container');
const messageViewer = $('#chat-viewer');

socket.on('connect', function() {
  socketid = socket.id;
});

window.speechSynthesis.onvoiceschanged = function() {
  let voiceOptions = ['Ava', 'Allison', 'Samantha', 'Susan', 'Vicki', 'Kathy', 'Victoria'];
  let voices = window.speechSynthesis.getVoices();
  for (let v in voices) {
    console.log(voices[v]);
    let ind = voiceOptions.indexOf(voices[v].voiceURI);
    if (ind !== -1 && ind < selectedVoiceIndex) {
      selectedVoice = voices[v];
      selectedVoiceIndex = ind;
      console.log('found! ' + voices[v]);
    }
  }
};

window.init = () => {
  // get intro text
  fetch('/static/data/04_convo1_intro.txt')
    .then(res => res.text())
    .then(text => {
      introText = text;
      socket.on('emotion:update', updateEmotion);
      socket.on('chat:new', handleNewMessage);
      socket.emit('emotion:get');
    });
  
  enableAutoTTS();
  
  introEl.on('click', showChatInput);
  chatForm.submit(sendMessage);
  $(document).on('keydown', (e) => {
    if (e.which === 13) {
      sendMessage(e); 
    }
  });
  
  chatInput.on('focus', () => {
    $('#chat-submit').addClass('focused'); 
  });
  
  chatInput.on('change keyup', () => {
    if (chatInput.val()) {
      chatSubmit.show();
    } else {
      chatSubmit.hide();
    }
    startResetTimeout();
  });

  document.addEventListener('touchmove', (e) => { 
    e.preventDefault(); 
  }, { passive:false });
};

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
  chatForm.show();
  if (chatInput.val()) {
    chatInput.trigger('focus'); // this may not work on iPad, unless triggered by click
  }
}

function showMessageViewer() {
  introEl.hide();
  chatForm.hide();
  chatInput.trigger('blur'); // this doesn't work on iPad
  // if (chatInput.is(':focus')) {
  //   messageViewerContainer.addClass('compact');
  // } else {
  //   messageViewerContainer.removeClass('compact');
  // }
  messageViewerContainer.show();
}

function updateEmotion(msg) {
  if (!curEmotion || curEmotion.name !== msg.name) {
    curEmotion = msg;
    console.log('emotion has been updated to: ' + msg.name + ' (base: ' + msg.base + ', level: ' + msg.level + ')');
    updateInterface();
  }
}

function updateInterface() {
  showLoadingOverlay(curEmotion, function() {
  });
  resetChat();
  const colors = window.baseColors[curEmotion.base][curEmotion.level - 1];
  const textColor = getTextColorForBackground(colors[0], colors[1]);
  $('body').css('color', textColor);
  $('body').css('background', `radial-gradient(${colors[0]},${colors[1]})`);
  $('#debug-info').text(screen.width + ' ' + screen.height);//CURRENT EMOTION: ' + curEmotion.name + ' (base: ' + curEmotion.base + ', level: ' + curEmotion.level +')')
}

function handleNewMessage(data) {
  showMessageViewer();
  console.log(data.id, socketid);
  if (data.id !== socketid) { // only show modified to partner
    console.log('speak ' + data.modified);
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
    }, pauseOnMessageTime);
    return;
  }
  
  setTimeout(function() {
    // Set the instruction to the current text + the next character
    // whilst incrementing the iteration variable
    messageViewer.text(messageViewer.text() + ' ' + words[iteration++]);
    messageViewer.animate({ scrollTop: messageViewer[0].scrollHeight}, 1);
    startResetTimeout();
    // Re-trigger our function
    typeMessageByWord(string, iteration);
  }, typingSpeed);
}

function speak(msg, vol) {
  if (arguments.length === 1) {
    vol = 1;
  }
  const utterance = new SpeechSynthesisUtterance(msg);
  utterance.volume = vol;
  if (selectedVoice) utterance.voice = selectedVoice;
  speechSynthesis.speak(utterance);
}

// function for making sure text to speech is available on iOS Safari
function enableAutoTTS() {
  if (typeof window === 'undefined') {
    return; 
  }
  
  const simulateSpeech = () => {
    speak('Hello', 0);
    document.removeEventListener('click', simulateSpeech);
  };

  document.addEventListener('click', simulateSpeech);
}