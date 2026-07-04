import express from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { logger } from "./lib/logger.js";
import helmet from "helmet";
import { createServer } from "http";

import { env } from "./config/env.js";

import authRoutes from "./routes/authRoutes.js";
import tableRoutes from "./routes/tableRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import menuRoutes from "./routes/menuRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import publicRoutes from "./routes/publicRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";

import { initializeSocket } from "./lib/socket.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { apiLimiter } from "./middleware/rateLimiter.js";
import { successResponse, errorResponse } from "./utils/apiResponse.js";

const app = express();
const httpServer = createServer(app);

initializeSocket(httpServer);

/**
 * Express Configuration
 */
app.disable("x-powered-by");
app.set("trust proxy", 1);

/**
 * Security
 */
app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  }),
);

app.use(
  cors({
    origin: env.CORS_ORIGIN.split(",").map((origin) => origin.trim()),
    credentials: true,
  }),
);

/**
 * Rate Limiting
 */
app.use(apiLimiter);

/**
 * Body Parsers
 */
app.use(
  express.json({
    limit: "1mb",
  }),
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb",
  }),
);

/**
 * Logging
 */
app.use(
  pinoHttp({
    logger,
  }),
);

/**
 * Health Check
 */
app.get("/health", (_req, res) => {
  return res.json(
    successResponse("CafeOS API is healthy", {
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    }),
  );
});

/**
 * Routes
 */
app.use("/auth", authRoutes);
app.use("/public", publicRoutes);
app.use("/tables", tableRoutes);
app.use("/categories", categoryRoutes);
app.use("/menu", menuRoutes);
app.use("/orders", orderRoutes);
app.use("/dashboard", dashboardRoutes);

/**
 * 404 Handler
 */
app.use((_req, res) => {
  return res
    .status(404)
    .json(errorResponse("Route not found"));
});

/**
 * Global Error Handler
 */
app.use(errorHandler);

/**
 * Server
 */
if (env.NODE_ENV !== "test") {
  httpServer.listen(env.PORT, () => {
    logger.info(
      `🚀 CafeOS Backend running on port ${env.PORT}`,
    );
  });
}

export default app;