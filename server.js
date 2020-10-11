const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
app.use('/', express.static('areas'))

io.on('connection', (socket) => {
  console.log('user connected: ' + socket.id);
  socket.on('disconnect', () => { console.log('user disconnected: ' + socket.id); });

  socket.on('emotion update', function(msg){
    io.emit('emotion update', msg);
    console.log(msg);
  });
});


http.listen(3000, () => {
  console.log('listening on *:3000');
});