import $ from 'jquery';
import { getTextColorForBackground } from './lib/imageColorUtils.js';
import '../css/04-convo1.scss';
import './shared.js';
import { enableAutoTTS, speak} from './lib/speech.js';
import i18next from 'i18next';

let curEmotion = '';
let introText = '';
let introText0 = '';
let introText1 = '';
let interruptIntro = false;
let uiResetTimeout, showChatTimeout;
let resetWaitTime = 10 * 1000; // Time before intro reset && inactivity timer
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

window.soundType = 'mute';
window.init = () => {

  fetch(i18next.t('04_convo1_intro.txt', {lng: window.lang0}))
    .then(res0 => res0.text())
    .then(text0 => {
      introText0 = text0;
      fetch(i18next.t('04_convo1_intro.txt', {lng: window.lang1}))
        .then(res1 => res1.text())
        .then(text1 => {
          introText1 = text1;
          socket.on('emotion:update', updateEmotion);
          socket.on('chat:new', handleNewMessage);
          socket.emit('emotion:get');
        }); 
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

  // translation for chat input placeholder
  const placeholderT = i18next.t('type_a_message', {lng: window.lang0}) + ' ' + i18next.t('type_a_message', {lng: window.lang1});
  $('#chat-input').attr('placeholder', placeholderT);
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

  interruptIntro = false;
  const introTime0 = introText0.split(' ').length * typingSpeed;
  typeMessageByWord(introText0, introEl, 0, false);
  introEl.show();
  // Wait for 1st language intro to finish then begin 2nd
  setTimeout(() => { typeMessageByWord(introText1, introEl, 0, true); }, introTime0 + 2000);

  // Show hand-indicator just after 2nd language intro begins
  setTimeout(() => { 
    if (introEl.is(':visible')) $('#hand-indicator').show(); 
  }, introTime0 + 3000);
}

function startResetTimeout() {
  clearTimeout(uiResetTimeout);
  uiResetTimeout = setTimeout(resetChat, resetWaitTime);
  console.log('start reset timeout ' + uiResetTimeout);
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
    interruptIntro = true;
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
  $('.main').css('background', `radial-gradient(${colors[0]},${colors[1]})`);
  $('#debug-info').text(screen.width + ' ' + screen.height);//CURRENT EMOTION: ' + curEmotion.name + ' (base: ' + curEmotion.base + ', level: ' + curEmotion.level +')')
}

function handleNewMessage(data) {
  showMessageViewer();
  console.log(data.id, socketid);
  if (data.id !== socketid) { // only show modified to partner
    console.log('speak ' + data.modified);
    speak(data.modified);
    typeMessageByWord(data.modified, messageViewer, 0, true);
  } else {
    typeMessageByWord(data.original, messageViewer, 0, true); 
  }
  
}

function typeMessageByWord(string, el, iteration, secondLang) {
  if (interruptIntro) {
    el.empty();
    return;
  }

  var iteration = iteration || 0;
  const words = string.split(' ');

  // Prevent our code executing if there are no letters left
  if (iteration === words.length) {
    // Check to see if intro has been clicked away
    if (introEl.is(':hidden')) {
      showChatTimeout = setTimeout(() => { 
        showChatInput();
      }, pauseOnMessageTime);
    }
    // Check to see if second language has gone before resetting
    if (secondLang) { 
      startResetTimeout();
    }
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
    typeMessageByWord(string, el, iteration, secondLang);
  }, typingSpeed);
}



$('body').on('click', () => {
  document.querySelector('body').requestFullscreen();
})