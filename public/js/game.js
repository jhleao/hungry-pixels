export function createGame(screenDimensions) {
  const state = {
    players: {},
    fruits: {},
  };

  const config = {
    frequency: 1000,
    intervalId: null,
    scoreTarget: null,
    screen: {
      width: screenDimensions.width,
      height: screenDimensions.height,
    },
  };

  const gameIsRunning = () => !!config.intervalId;

  const observers = [];

  function subscribe(observerFunction) {
    observers.push(observerFunction);
  }

  function notifyAll(command) {
    for (const observerFunction of observers) {
      observerFunction(command);
    }
  }

  function addPlayer(command) {
    const playerId = command.playerId;
    const playerName = command.playerName;
    const playerX =
      'playerX' in command
        ? command.playerX
        : Math.floor(Math.random() * config.screen.width);
    const playerY =
      'playerY' in command
        ? command.playerY
        : Math.floor(Math.random() * config.screen.width);
    const playerScore = 'playerScore' in command ? command.playerScore : 0;

    state.players[playerId] = {
      name: playerName,
      x: playerX,
      y: playerY,
      score: playerScore,
    };

    notifyAll({
      type: 'add-player',
      playerId,
      playerName,
      playerX,
      playerY,
      playerScore,
    });
  }

  function removePlayer(command) {
    const { playerId } = command;

    delete state.players[playerId];

    notifyAll({
      type: 'remove-player',
      playerId,
    });
  }

  function addFruit(command, tries = 0) {
    const screenArea = config.screen.width * config.screen.height;
    const fruitAmount = Object.keys(state.fruits).length;
    const mapIsFull = fruitAmount >= screenArea;
    if (mapIsFull) return;

    const fruitId = command
      ? command.fruitId
      : Math.floor(Math.random() * 1000000);
    const fruitX = command
      ? command.fruitX
      : Math.floor(Math.random() * config.screen.width);
    const fruitY = command
      ? command.fruitY
      : Math.floor(Math.random() * config.screen.height);

    const coordsAlreadyHaveFruit = Object.keys(state.fruits).reduce(
      (acc, fruitId) => {
        const fruit = state.fruits[fruitId];
        return acc || (fruit.x === fruitX && fruit.y === fruitY);
      },
      false
    );

    if (coordsAlreadyHaveFruit) {
      if (tries < 200) addFruit(command, ++tries);
      return;
    }

    state.fruits[fruitId] = { x: fruitX, y: fruitY };

    notifyAll({
      type: 'add-fruit',
      fruitId,
      fruitX,
      fruitY,
    });
  }

  function removeFruit(command) {
    const { fruitId } = command;

    delete state.fruits[fruitId];

    notifyAll({
      type: 'remove-fruit',
      fruitId,
    });
  }

  function movePlayer(command) {
    const acceptedMoves = {
      ArrowUp: (player) => (player.y = Math.max(player.y - 1, 0)),
      ArrowDown: (player) =>
        (player.y = Math.min(player.y + 1, config.screen.height - 1)),
      ArrowLeft: (player) => (player.x = Math.max(player.x - 1, 0)),
      ArrowRight: (player) =>
        (player.x = Math.min(player.x + 1, config.screen.width - 1)),
    };

    const { keyPressed, playerId } = command;
    const player = state.players[playerId];
    const moveFunction = acceptedMoves[keyPressed];

    if (player && moveFunction) {
      moveFunction(player);
      checkCollision(playerId);
      notifyAll({
        type: 'move-player',
        playerId,
        keyPressed,
      });
    }
  }

  function addOnePoint(command) {
    const player = state.players[command.playerId];
    player.score++;
    notifyAll({
      type: 'score-one',
      playerId: command.playerId,
    });
    if (config.scoreTarget && player.score >= config.scoreTarget) {
      stop();
      clearFruits();
      announceWinner(command.playerId);
    }
  }

  function checkCollision(playerId) {
    const player = state.players[playerId];

    for (const fruitId in state.fruits) {
      const fruit = state.fruits[fruitId];
      if (!fruit) return;
      if (player.y === fruit.y && player.x === fruit.x) {
        removeFruit({ fruitId });
        addOnePoint({ playerId });
      }
    }
  }

  function setState(newState) {
    Object.assign(state, newState);
  }

  function start() {
    if (gameIsRunning()) stop();
    config.intervalId = setInterval(addFruit, config.frequency);
  }

  function stop() {
    clearInterval(config.intervalId);
    config.intervalId = null;
  }

  function setFrequency(frequency) {
    config.frequency = frequency;
    if (gameIsRunning()) start();
  }

  function setScreenSize(width, height) {
    config.screen.width = width;
    config.screen.height = height;
    randomizeAllPositions();
  }

  function randomizeAllPositions() {
    for (const playerId in state.players) {
      const player = state.players[playerId];
      player.x = Math.floor(Math.random() * config.screen.width);
      player.y = Math.floor(Math.random() * config.screen.height);
    }
    for (const fruitId in state.fruits) {
      const fruit = state.fruits[fruitId];
      fruit.x = Math.floor(Math.random() * config.screen.width);
      fruit.y = Math.floor(Math.random() * config.screen.height);
    }
  }

  function setTarget(scoreTarget) {
    config.scoreTarget = scoreTarget;
  }

  function setConfig(newConfig) {
    Object.assign(config, newConfig);
  }

  function resetScores() {
    for (const playerId in state.players) {
      const player = state.players[playerId];
      player.score = 0;
    }
    notifyAll({ type: 'reset-scores' });
  }

  function clearFruits() {
    state.fruits = {};
    notifyAll({ type: 'clear-fruits' });
  }

  function announceWinner(playerId) {
    notifyAll({
      type: 'announce-winner',
      playerId,
    });
  }

  return {
    movePlayer,
    state,
    config,
    addPlayer,
    removePlayer,
    addFruit,
    removeFruit,
    setState,
    subscribe,
    addOnePoint,
    start,
    stop,
    resetScores,
    clearFruits,
    setFrequency,
    setTarget,
    setConfig,
    setScreenSize,
  };
}
