import { app } from './app.js';
import http from 'http';

const server = http.createServer(app.express);
app.initializeSockets(server);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
});
