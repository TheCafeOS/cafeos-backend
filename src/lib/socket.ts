import { Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";

import { env } from "../config/env.js";
import { logger } from "./logger.js";
import { getTableIdByQrToken } from "../services/public.service.js";
import { verifyAccessToken } from "../utils/jwt.js";

export let io: Server;

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

      socket.data.employeeId = payload.sub;
      socket.data.restaurantId = payload.restaurantId;
      socket.data.role = payload.role;

      next();
    } catch (error) {
        logger.warn(
          {
            socketId: socket.id,
            ip: socket.handshake.address,
          },
          "Socket authentication failed",
        );

        next(new Error("Unauthorized"));
      }
  });

  io.on("connection", (socket: Socket) => {
  const restaurantId = socket.data.restaurantId;

  if (restaurantId) {
    socket.join(`restaurant_${restaurantId}`);
  }

  logger.info(
    {
      socketId: socket.id,
      restaurantId: socket.data.restaurantId,
      employeeId: socket.data.employeeId,
    },
    "Socket connected",
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
      {
        socketId: socket.id,
        restaurantId: socket.data.restaurantId,
        employeeId: socket.data.employeeId,
      },
      "Socket disconnected",
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
  try {
    const socket = getIO();

    logger.debug(
      {
        event,
        restaurantId,
        tableId,
      },
      "Broadcasting order event",
    );

    socket.to(`restaurant_${restaurantId}`).emit(event, {
      tableId,
      ...data,
    });

    socket.to(`table_${tableId}`).emit(event, data);
  } catch (error) {
    logger.warn(
      {
        event,
        restaurantId,
        tableId,
        error: error instanceof Error ? error.message : error,
      },
      "Socket.IO not available for order event broadcast",
    );
  }
};