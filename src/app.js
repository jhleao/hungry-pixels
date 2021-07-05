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
    this.game.start();
  }

  initializeSockets(server){
    this.sockets = new io.Server(server);

    this.sockets.on('connection', socket => {
      const playerId = socket.id;
      console.log('Socket connected on Server with id ' + playerId);
      this.game.addPlayer({ playerId });
      socket.emit('setup', this.game.state);
      socket.on('disconnect', () => {this.game.removePlayer({ playerId })});
      socket.on('move-player', command => {
        command.playerId = playerId;
        command.type = 'move-player';
        this.game.movePlayer(command);
      });
      this.game.subscribe((command) => {
        console.log(`Emmiting command of type ${command.type}`);
        socket.emit(command.type, command);
      });
    });

  }
}

export const app = new App();