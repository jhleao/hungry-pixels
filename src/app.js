import express from 'express';

class App {
  app = express();

  constructor(){
    this.middlewares();
  }

  middlewares(){
    this.app.use(express.static('public'));
  }
}

export const app = new App().app;