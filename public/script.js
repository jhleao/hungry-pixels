import { createGame } from "./game.js";
import { renderScreen } from './renderScreen.js';
import { createKeyboardListener } from "./keyboardListener.js";

const screen = document.getElementById('screen');

const game = createGame({width: screen.width, height: screen.height});

const input = createKeyboardListener(document);

const socket = io();

socket.on('connect', () => {
  const playerId = socket.id;
  console.log('Player connected on Cient with id: ' + playerId);

  input.registerPlayerId(playerId);
  input.subscribe(game.movePlayer);
  renderScreen(screen, game, window, playerId);

  game.subscribe(command => {
    if(command.playerId === playerId && command.type === 'move-player')
      socket.emit('move-player', command);
  });

  socket.on('setup', state => {
    game.setState(state);
  })

  socket.on('add-player', command => {
    game.addPlayer(command);
  })

  socket.on('remove-player', command => {
    game.removePlayer(command);
  })

  socket.on('move-player', command => {
    if(command.playerId !== playerId)
      game.movePlayer(command);
  });

  socket.on('add-fruit', command => {
    game.addFruit(command);
  });

  socket.on('remove-fruit', command => {
    game.removeFruit(command);
  });
})

socket.onAny((eventName) => console.log(eventName))
