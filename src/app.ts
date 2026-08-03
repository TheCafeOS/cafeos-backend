import express from "express";
import cors from "cors";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import { pinoHttp } from "pino-http";

import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { swaggerSpec } from "./docs/swagger.js";

import authRoutes from "./routes/authRoutes.js";
import tableRoutes from "./routes/tableRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import menuRoutes from "./routes/menuRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import publicRoutes from "./routes/publicRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import loyaltyRoutes from "./routes/loyaltyRoutes.js";

import { apiLimiter } from "./middleware/rateLimiter.js";
import { errorHandler } from "./middleware/errorHandler.js";

import {
  successResponse,
  errorResponse,
} from "./utils/apiResponse.js";
import { requestId } from "./middleware/requestId.js";
import settingsRoutes from "./routes/settings.routes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import auditRoutes from "./routes/auditRoutes.js";
import { prisma } from "./lib/prisma.js";

const app = express();

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
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (env.corsOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
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

app.use(requestId);

/**
 * Logging
 */
app.use(
  pinoHttp({
    logger,

    autoLogging: {
      ignore: (req) =>
        req.url === "/health" ||
        req.url.startsWith("/api-docs"),
    },

    customProps: (req) => ({
      requestId: req.requestId,
    }),

    customLogLevel: (_req, res, err) => {
      if (err || res.statusCode >= 500) {
        return "error";
      }

      if (res.statusCode >= 400) {
        return "warn";
      }

      return "info";
    },
  }),
);

/**
 * Health
 */
app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return res.json(
      successResponse("CafeOS API is healthy", {
        status: "ok",
        database: "connected",
        environment: env.NODE_ENV,
        uptime: Math.floor(process.uptime()),
        version: process.env.npm_package_version ?? "unknown",
        timestamp: new Date().toISOString(),
      }),
    );
  } catch {
    return res.status(503).json({
      status: "error",
      message: "Database unavailable",
      data: {
        status: "degraded",
        database: "disconnected",
        environment: env.NODE_ENV,
        uptime: Math.floor(process.uptime()),
        version: process.env.npm_package_version ?? "unknown",
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Swagger
 */
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec),
);

/**
 * Routes
 */
const API_PREFIX = "/api/v1";

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/public`, publicRoutes);
app.use(`${API_PREFIX}/tables`, tableRoutes);
app.use(`${API_PREFIX}/categories`, categoryRoutes);
app.use(`${API_PREFIX}/menu`, menuRoutes);
app.use(`${API_PREFIX}/orders`, orderRoutes);
app.use(`${API_PREFIX}/dashboard`, dashboardRoutes);
app.use(`${API_PREFIX}/settings`, settingsRoutes);
app.use(`${API_PREFIX}/employees`, employeeRoutes);
app.use(`${API_PREFIX}/audit-logs`, auditRoutes);
app.use(`${API_PREFIX}/loyalty`, loyaltyRoutes);

/**
 * 404
 */
app.use((_req, res) => {
  return res
    .status(404)
    .json(errorResponse("Route not found"));
});

/**
 * Error Handler
 */
app.use(errorHandler);

export default app;