export function createGame(screenDimensions){
  const state = {
    players: {},
    fruits: {},
    screen: {
      width: screenDimensions.width,
      height: screenDimensions.height
    }
  }

  const observers = [];

  function subscribe(observerFunction){
    observers.push(observerFunction);
  };

  function notifyAll(command){
    for(const observerFunction of observers){
      observerFunction(command);
    }
  };

  function addPlayer(command){
    const playerId = command.playerId;
    const playerX = 'playerX' in command ? command.playerX : Math.floor(Math.random() * state.screen.width);
    const playerY = 'playerY' in command ? command.playerY : Math.floor(Math.random() * state.screen.width);

    state.players[playerId] = { x: playerX, y: playerY };

    notifyAll({
      type: 'add-player',
      playerId,
      playerX,
      playerY,
    });
  }

  function removePlayer(command){
    const { playerId } = command;

    delete state.players[playerId];

    notifyAll({
      type: 'remove-player',
      playerId,
    })
  }

  function addFruit(command){
    const fruitId = command ? command.fruitId : Math.floor(Math.random() * 1000000);
    const fruitX = command ? command.fruitX : Math.floor(Math.random() * state.screen.width);
    const fruitY = command ? command.fruitY : Math.floor(Math.random() * state.screen.height);

    state.fruits[fruitId] = { x: fruitX, y: fruitY };

    notifyAll({
      type: 'add-fruit',
      fruitId,
      fruitX,
      fruitY,
    })
  }

  function removeFruit(command){
    const { fruitId } = command;

    delete state.fruits[fruitId];

    notifyAll({
      type: 'remove-fruit',
      fruitId
    });
  }

  function movePlayer(command){
    const acceptedMoves = {
      ArrowUp: player => player.y = Math.max(player.y - 1, 0),
      ArrowDown: player => player.y = Math.min(player.y + 1, state.screen.height - 1),
      ArrowLeft: player => player.x = Math.max(player.x - 1, 0),
      ArrowRight: player => player.x = Math.min(player.x + 1, state.screen.width - 1),
    }

    const { keyPressed, playerId } = command
    const player = state.players[playerId];
    const moveFunction = acceptedMoves[keyPressed];

    if(player && moveFunction) {
      moveFunction(player);
      checkCollision(playerId);
      notifyAll({
        type: 'move-player',
        playerId,
        keyPressed,
      });
    }
  }

  function checkCollision(playerId){
    const player = state.players[playerId];

    for(const fruitId in state.fruits){
      const fruit = state.fruits[fruitId];
      if(player.y === fruit.y && player.x === fruit.x)
        removeFruit({ fruitId })
    }
  }

  function setState(newState){
    Object.assign(state, newState);
  }

  function start(){
    const frequency = 2000;
    setInterval(addFruit, frequency);
  }

  return { 
    movePlayer, 
    state, 
    addPlayer, 
    removePlayer, 
    addFruit, 
    removeFruit, 
    setState,
    subscribe,
    start,
  };
}