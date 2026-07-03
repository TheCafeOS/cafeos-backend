import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';

let io: Server;

export const initializeSocket = (httpServer: HTTPServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('join_table', (tableId: string) => {
      socket.join(`table_${tableId}`);
      console.log(`Socket ${socket.id} joined table_${tableId}`);
    });

    socket.on('leave_table', (tableId: string) => {
      socket.leave(`table_${tableId}`);
      console.log(`Socket ${socket.id} left table_${tableId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

export const broadcastOrderEvent = (
  restaurantId: string,
  tableId: string,
  event: string,
  data: any
) => {
  io.to(`restaurant_${restaurantId}`).emit(event, {
    tableId,
    ...data,
  });
  io.to(`table_${tableId}`).emit(event, data);
};
