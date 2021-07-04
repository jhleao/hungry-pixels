import { app } from './app.js';
import http from 'http';
import * as io from 'socket.io';

const server = http.createServer(app.express);
const sockets = new io.Server(server);

const PORT = process.env.PORT || 5000;

sockets.on('connection', socket => {
  const playerId = socket.id;
  console.log('Socket connected on Server with id ' + playerId);

  socket.emit('setup', app.game.state);
})

server.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
});
