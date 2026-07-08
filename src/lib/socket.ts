import { Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";

import { env } from "../config/env.js";
import { logger } from "./logger.js";

let io: Server;

export const initializeSocket = (httpServer: HTTPServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: env.corsOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on('connection', (socket: Socket) => {
    logger.info(
      { socketId: socket.id },
      "Client connected",
    );

    socket.on('join_table', (tableId: string) => {
      socket.join(`table_${tableId}`);
      logger.info(
        {
          socketId: socket.id,
          tableId,
        },
        "Joined table room",
      );
    });

    socket.on('leave_table', (tableId: string) => {
      socket.leave(`table_${tableId}`);
      logger.info(
        {
          socketId: socket.id,
          tableId,
        },
        "Left table room",
      );
    });

    socket.on('disconnect', () => {
      logger.info(
        { socketId: socket.id },
        "Client disconnected",
      );
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
  data: Record<string, unknown>
) => {
  io.to(`restaurant_${restaurantId}`).emit(event, {
    tableId,
    ...data,
  });
  io.to(`table_${tableId}`).emit(event, data);
};
