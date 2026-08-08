export function connect(onMsg, onOpen) {
  let socket;
  const open = () => {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    socket = new WebSocket(`${protocol}//${location.host}`);
    socket.addEventListener('message', (e) => onMsg(JSON.parse(e.data)));
    socket.addEventListener('close', () => setTimeout(open, 1000));
    if (onOpen) socket.addEventListener('open', () => onOpen());
  };
  open();
  return {
    socket: () => socket,
    send: (obj) => socket?.readyState === 1 && socket.send(JSON.stringify(obj)),
  };
}
