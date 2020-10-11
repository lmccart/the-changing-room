let emotions;
const socket = io();
socket.on('emotion update', updateEmotion);

$('#emotions').change(pickEmotion);

$.getJSON('all-emotions.json', (data) => {
  console.log(data);
  emotions = data;
  populatePicker();
});

function populatePicker() {
  for (item in emotions) {
    $('#emotions').append($('<option>', {
      value: item,
      text: emotions[item].emotion
    }));
  }
}

function pickEmotion() {
  let index = $('#emotions').val();
  socket.emit('emotion update', emotions[index]);
}

function updateEmotion(msg) {
  console.log('emotion has been updated to: ' + msg.emotion);
}