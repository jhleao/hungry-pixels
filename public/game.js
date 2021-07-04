export function createGame(screenDimensions){
  const state = {
    players: {},
    fruits: {},
    screen: {
      width: screenDimensions.width,
      height: screenDimensions.height
    }
  }

  function addPlayer(command){
    const { playerId, playerX, playerY } = command;

    state.players[playerId] = { x: playerX, y: playerY };
  }

  function removePlayer(command){
    const { playerId } = command;

    delete state.players[playerId];
  }

  function addFruit(command){
    const { fruitId, fruitX, fruitY } = command;

    state.fruits[fruitId] = { x: fruitX, y: fruitY };
  }

  function removeFruit(command){
    const { fruitId } = command;

    delete state.fruits[fruitId];
  }

  function movePlayer(command){
    const acceptedMoves = {
      ArrowUp: player => player.y = Math.max(player.y - 1, 0),
      ArrowDown: player => player.y = Math.min(player.y + 1, state.screen.height),
      ArrowLeft: player => player.x = Math.max(player.x - 1, 0),
      ArrowRight: player => player.x = Math.min(player.x + 1, state.screen.width),
    }

    const { keyPressed, playerId } = command
    const player = state.players[playerId];
    const moveFunction = acceptedMoves[keyPressed];
    if(player && moveFunction) moveFunction(player) && checkCollision(playerId);
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

  return { movePlayer, state, addPlayer, removePlayer, addFruit, removeFruit, setState };
}