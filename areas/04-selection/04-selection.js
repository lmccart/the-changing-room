let emotions;
let curEmotion;
const socket = io();
socket.on('emotion:update', updateEmotion);
let obj = {};

$('#emotions').change(pickEmotion);

$.getJSON('/emotions', (data) => {
  console.log(data);
  emotions = data;
  populatePicker();
});

function populatePicker() {
  for (item in emotions) {
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
  $('#emotions').val(curEmotion.name);
}