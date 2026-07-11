import { Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";

import { env } from "../config/env.js";
import { logger } from "./logger.js";
import { getTableIdByQrToken } from "../services/public.service.js";
import { verifyAccessToken } from "../utils/jwt.js";
import { authService } from "../services/auth.service.js";

let io: Server;

export const initializeSocket = (httpServer: HTTPServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: env.corsOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next();
      }

      const payload = verifyAccessToken(token);

      const employee = await authService.getEmployeeForSocket(payload.sub);

      socket.data.restaurantId = employee.restaurantId;

      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket: Socket) => {
  const restaurantId = socket.data.restaurantId;

  if (restaurantId) {
    socket.join(`restaurant_${restaurantId}`);
  }

  logger.info(
    { socketId: socket.id },
    "Client connected",
  );

  socket.on("join_table", (tableId: string) => {
    socket.join(`table_${tableId}`);
  });

  socket.on("join_qr", async (qrToken: string) => {
    try {
      const tableId = await getTableIdByQrToken(qrToken);
      socket.join(`table_${tableId}`);
    } catch {
      // Ignore invalid QR token
    }
  });

  socket.on("leave_table", (tableId: string) => {
    socket.leave(`table_${tableId}`);
  });

  socket.on("disconnect", () => {
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
    throw new Error("Socket.IO not initialized");
  }
  return io;
};

export const broadcastOrderEvent = (
  restaurantId: string,
  tableId: string,
  event: string,
  data: Record<string, unknown>,
) => {
  const socket = getIO();

  socket.to(`restaurant_${restaurantId}`).emit(event, {
    tableId,
    ...data,
  });

  socket.to(`table_${tableId}`).emit(event, data);
};