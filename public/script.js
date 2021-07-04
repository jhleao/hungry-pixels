import { createGame } from "./game.js";
import { renderScreen } from './renderScreen.js';
import { createKeyboardListener } from "./keyboardListener.js";

const screen = document.getElementById('screen');

const game = createGame({width: screen.width, height: screen.height});

game.addPlayer({ playerId: 'player1', playerX: 0, playerY: 0 });
game.addFruit({ fruitId: 'fruit1', fruitX: 9, fruitY: 5 });

const input = createKeyboardListener(document);
input.subscribe(game.movePlayer);

renderScreen(screen, game, window);
