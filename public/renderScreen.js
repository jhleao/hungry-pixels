export function renderScreen(screen, game, window, ranking, currentPlayerId) {
  const context = screen.getContext('2d');
  context.clearRect(0, 0, 10, 10); 

  for(const playerId in game.state.players){
    const player = game.state.players[playerId];
    context.fillStyle = 'black';
    context.fillRect(player.x, player.y, 1, 1);
  };

  for(const fruitId in game.state.fruits){
    const fruit = game.state.fruits[fruitId];
    context.fillStyle = 'green';
    context.fillRect(fruit.x, fruit.y, 1, 1);
  }

  const currentPlayer = game.state.players[currentPlayerId];

  if(currentPlayer){
    context.fillStyle = '#F0DB4F';
    context.fillRect(currentPlayer.x, currentPlayer.y, 1, 1);
  }

  updateRanking(ranking, game.state, currentPlayerId);

  window.requestAnimationFrame(() => {
    renderScreen(screen, game, window, ranking, currentPlayerId);
  });
};

function updateRanking(ranking, state, currentPlayerId){
  let newRanking = '';
  const playersArr = [];
  for (const playerId in state.players){
    const player = state.players[playerId];
    playersArr.push({
      id: playerId,
      score: player.score
    })
  }
  playersArr.sort((a, b) => b.score - a.score).map(p => {
    const isCurrentPlayer = currentPlayerId === p.id;
    newRanking += `
      <li ${isCurrentPlayer ? 'class="current-player"' : ''}>
        <b>${p.id}: </b>${p.score}
      </li>`

  })
  ranking.innerHTML = newRanking;
};
