export function connect(onMsg) {
  let socket;
  const open = () => {
    socket = new WebSocket(`ws://${location.host}`);
    socket.addEventListener('message', (e) => onMsg(JSON.parse(e.data)));
    socket.addEventListener('close', () => setTimeout(open, 1000));
  };
  open();
  return {
    socket: () => socket,
    send: (obj) => socket?.readyState === 1 && socket.send(JSON.stringify(obj)),
  };
}
