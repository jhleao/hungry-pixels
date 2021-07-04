import express from 'express';
import { createGame } from '../public/game.js'; 

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

    console.log(this.game.state);
  }
}

export const app = new App();