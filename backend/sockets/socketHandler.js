// TODO: Wire Socket.io handlers here later
// Events to handle:
// - notice:broadcast
// - notification:update
// - pulse:update
const initSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);
    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);
    });
  });
};
module.exports = { initSocket };
