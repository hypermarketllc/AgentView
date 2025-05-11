import { Server } from 'socket.io';
import http from 'http';

let io: Server;

export const initLogSocket = (server: http.Server) => {
  io = new Server(server, { path: '/ws/logs' });

  io.on('connection', (socket) => {
    console.log('[logSocket] client connected');
    socket.emit('logs', { msg: 'Log streaming started' });

    socket.on('disconnect', () => {
      console.log('[logSocket] client disconnected');
    });
  });
};

export const emitLog = (data: any) => {
  if (io) io.emit('logs', data);
};