import express from 'express';
import { createGame } from '../public/game.js'; 
import * as io from 'socket.io';

class App {
  express = express();
  game;

  constructor(){
    this.middlewares();
    this.initializeGame();
  }

  middlewares(){
    this.express.use(express.static('public'));
  }

  initializeGame(){
    this.game = createGame({ width: 10, height: 10 });

    this.game.addPlayer({ playerId: 'player1', playerX: 0, playerY: 0 });
    this.game.addFruit({ fruitId: 'fruit1', fruitX: 9, fruitY: 5 });
  }

  initializeSockets(server){
    this.sockets = new io.Server(server);

    this.sockets.on('connection', socket => {
      const playerId = socket.id;
      console.log('Socket connected on Server with id ' + playerId);

      socket.emit('setup', this.game.state);
    })
  }
}

export const app = new App();