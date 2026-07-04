import { createServer } from "http";

import app from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { initializeSocket } from "./lib/socket.js";

const httpServer = createServer(app);

initializeSocket(httpServer);

if (env.NODE_ENV !== "test") {
  httpServer.listen(env.PORT, () => {
    logger.info(
      `🚀 CafeOS Backend running on port ${env.PORT}`,
    );
  });
}