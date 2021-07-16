import { createGame } from './game.js';
import { renderScreen } from './renderScreen.js';
import { createKeyboardListener } from './keyboardListener.js';

const screen = document.getElementById('screen');
const ranking = document.getElementById('ranking');
const logoutButton = document.getElementById('logout-button');
logoutButton.onclick = () => logout(true);

const game = createGame({ width: screen.width, height: screen.height });

const input = createKeyboardListener(document);

const playerName = await fetch('/api/me')
  .then((r) => r.json())
  .then((r) => r.name);

const socket = io({ auth: { name: playerName } });

socket.on('connect', () => {
  const playerId = socket.id;
  console.log('Player connected on Client with id: ' + playerId);

  input.registerPlayerId(playerId);
  input.subscribe(game.movePlayer);
  renderScreen(screen, game, window, ranking, playerId);

  game.subscribe((command) => {
    if (command.playerId === playerId && command.type === 'move-player')
      socket.emit(command.type, command);
  });

  socket.on('setup', (state) => {
    game.setState(state);
  });

  socket.on('add-player', (command) => {
    game.addPlayer(command);
  });

  socket.on('remove-player', (command) => {
    game.removePlayer(command);
  });

  socket.on('move-player', (command) => {
    if (command.playerId !== playerId) game.movePlayer(command);
  });

  socket.on('add-fruit', (command) => {
    game.addFruit(command);
  });

  socket.on('remove-fruit', (command) => {
    game.removeFruit(command);
  });

  socket.on('score-one', (command) => {
    if (command.playerId !== playerId) game.addOnePoint(command);
  });

  socket.on('reset-scores', () => {
    game.resetScores();
  });

  socket.on('clear-fruits', () => {
    game.clearFruits();
  });

  // window.addEventListener('beforeunload', () => {
  //   logout();
  // });
});

async function logout(redirect) {
  await fetch('/api/logout', { method: 'POST' });
  if (redirect) window.location.reload();
}

// For debugging purposes
socket.onAny((eventName) => console.log(eventName));
