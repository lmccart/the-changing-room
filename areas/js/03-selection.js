// style and js imports
import '../css/03-selection.scss';
import './shared.js';

let curEmotion;
const socket = io();
socket.on('emotion:update', updateEmotion);

$('#emotions').change(pickEmotion);

$.getJSON('/emotions', (data) => {
  console.log(data);
  populatePicker(data);
});

function populatePicker(data) {
  for (item in data) {
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