export function createKeyboardListener(document) {
  const state = {
    observers: [],
    playerId: '',
  };

  function subscribe(observerFunction) {
    state.observers.push(observerFunction);
  };

  function notifyAll(command) {
    for(const observerFunction of state.observers){
      observerFunction(command);
    }
  }

  function registerPlayerId(playerId) {
    state.playerId = playerId;
  }

  document.addEventListener('keydown', handleKeydown);

  function handleKeydown(event){
    const { key } = event;

    const command = {
      playerId: state.playerId,
      keyPressed: key,
    }

    notifyAll(command);  
  }

  return { subscribe, registerPlayerId }
}