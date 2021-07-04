import { createGame } from "./game.js";
import { renderScreen } from './renderScreen.js';
import { createKeyboardListener } from "./keyboardListener.js";

const screen = document.getElementById('screen');

const game = createGame({width: screen.width, height: screen.height});

const input = createKeyboardListener(document);
input.subscribe(game.movePlayer);

renderScreen(screen, game, window);

const socket = io();

socket.on('connect', () => {
  const playerId = socket.id;
  console.log('Player connected on Cient with id: ' + playerId);
})

socket.on('setup', state => {
  game.setState(state);
})
