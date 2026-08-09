import { createServer } from "http";

import app from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { initializeSocket, io } from "./lib/socket.js";
import { prisma } from "./lib/prisma.js";
import dns from "node:dns";

dns.setDefaultResultOrder("ipv4first");

const httpServer = createServer(app);

initializeSocket(httpServer);

if (env.NODE_ENV !== "test") {
  httpServer.listen(env.PORT, () => {
    logger.info(
      `🚀 CafeOS Backend running on port ${env.PORT}`,
    );
  });
}

const gracefulShutdown = async (
  signal: NodeJS.Signals,
) => {
  logger.info(
    `${signal} received. Shutting down gracefully...`,
  );

  httpServer.close(async () => {
    try {
      io.close();

      await prisma.$disconnect();

      logger.info("Server shutdown completed.");

      process.exit(0);
    } catch (error) {
      logger.error(error, "Error during shutdown");

      process.exit(1);
    }
  });
};

process.on("SIGINT", () =>
  gracefulShutdown("SIGINT"),
);

process.on("SIGTERM", () =>
  gracefulShutdown("SIGTERM"),
);