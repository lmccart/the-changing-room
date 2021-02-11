import $ from 'jquery';
import { getTextColorForBackground } from './lib/imageColorUtils.js';
import '../css/04-convo1.scss';
import './shared.js';
import { enableAutoTTS, speak} from './lib/speech.js';

let curEmotion = '';
let introText = '';
let uiResetTimeout, showChatTimeout;
let resetWaitTime = 30 * 1000;
let socketid;
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

  messageViewerContainer.on('click', showChatInput);

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
  // introEl.text(introText);
  typeMessageByWord(introText, introEl);
  
  introEl.show(); 
  let introTime = introText.split(' ').length * typingSpeed;
  setTimeout(() => { 
    if (introEl.is(':visible')) $('#hand-indicator').show(); 
  }, introTime);
}

function startResetTimeout() {
  clearTimeout(uiResetTimeout);
  uiResetTimeout = setTimeout(resetChat, resetWaitTime);
  console.log('start reset timeout '+uiResetTimeout);
}

function showChatInput() {
  if (showChatTimeout) clearTimeout(showChatTimeout);
  $('#hand-indicator').hide();
  messageViewerContainer.hide(); 
  messageViewer.empty();
  introEl.hide();
  chatForm.show();
  startResetTimeout();
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
  let durations = showLoadingOverlay(curEmotion);
  setTimeout(resetChat, window.loadingDur); 
  const colors = window.baseColors[curEmotion.base][curEmotion.level - 1];
  const textColor = getTextColorForBackground(colors[0], colors[1]);
  $('body').css('color', textColor);
  introEl.css('color', textColor);
  chatInput.css('color', textColor);
  if (textColor === 'white') {
    chatSubmit.css('filter', 'invert(1)');
    $('#hand-indicator').css('filter', 'invert(1)');
  } else {
    chatSubmit.css('filter', 'none');
    $('#hand-indicator').css('filter', 'none');
  }
  $('body').css('background', `radial-gradient(${colors[0]},${colors[1]})`);
  $('#debug-info').text(screen.width + ' ' + screen.height);//CURRENT EMOTION: ' + curEmotion.name + ' (base: ' + curEmotion.base + ', level: ' + curEmotion.level +')')
}

function handleNewMessage(data) {
  showMessageViewer();
  console.log(data.id, socketid);
  if (data.id !== socketid) { // only show modified to partner
    console.log('speak ' + data.modified);
    speak(data.modified);
    typeMessageByWord(data.modified, messageViewer);
  } else {
    typeMessageByWord(data.original, messageViewer); 
  }
  
}

function typeMessageByWord(string, el, iteration) {
  var iteration = iteration || 0;
  const words = string.split(' ');
  
  // Prevent our code executing if there are no letters left
  if (iteration === words.length) {
    if (introEl.is(':hidden')) {
      showChatTimeout = setTimeout(() => { 
        showChatInput();
      }, pauseOnMessageTime);
    }
    startResetTimeout();
    return;
  }
  
  if (iteration === 0) {
    el.empty();
  }
  
  setTimeout(function() {
    // Set the instruction to the current text + the next character
    // whilst incrementing the iteration variable
    el.text(el.text() + ' ' + words[iteration++]);
    el.animate({ scrollTop: el[0].scrollHeight}, 1);
    // Re-trigger our function
    typeMessageByWord(string, el, iteration);
  }, typingSpeed);
}


