export function renderScreen(screen, game, window, ranking, currentPlayerId) {
  const context = screen.getContext('2d');
  context.clearRect(0, 0, screen.width, screen.height);

  const style = getComputedStyle(document.body);
  const green = style.getPropertyValue('--green');

  for (const playerId in game.state.players) {
    const player = game.state.players[playerId];
    context.fillStyle = player.color;
    context.fillRect(player.x, player.y, 1, 1);
  }

  for (const fruitId in game.state.fruits) {
    const fruit = game.state.fruits[fruitId];
    context.fillStyle = green;
    context.fillRect(fruit.x, fruit.y, 1, 1);
  }

  // const currentPlayer = game.state.players[currentPlayerId];

  // if (currentPlayer) {
  //   context.fillStyle = yellow;
  //   context.fillRect(currentPlayer.x, currentPlayer.y, 1, 1);
  // }

  updateRanking(ranking, game.state);

  window.requestAnimationFrame(() => {
    renderScreen(screen, game, window, ranking, currentPlayerId);
  });
}

function updateRanking(ranking, state) {
  let newRanking = '';
  const playersArr = [];
  for (const playerId in state.players) {
    const player = state.players[playerId];
    playersArr.push({
      id: playerId,
      name: player.name,
      score: player.score,
      color: player.color,
      textColor: player.textColor,
    });
  }
  playersArr
    .sort((a, b) => b.score - a.score)
    .map((p, i) => {
      newRanking += `
      <li style="background: ${p.color}; color: ${p.textColor};">
        ${i + 1}. <b>${p.name}:</b> ${p.score}
      </li>`;
    });
  ranking.innerHTML = newRanking;
}
