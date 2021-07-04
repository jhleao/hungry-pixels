export function createKeyboardListener(document) {
  const state = {
    observers: []
  };

  function subscribe(observerFunction) {
    state.observers.push(observerFunction);
  };

  function notifyAll(command) {
    for(const observerFunction of state.observers){
      observerFunction(command);
    }
  }

  document.addEventListener('keydown', handleKeydown);

  function handleKeydown(event){
    const { key } = event;

    const command = {
      playerId: 'player1',
      keyPressed: key,
    }

    notifyAll(command);  
  }

  return { subscribe }
}