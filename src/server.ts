import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import dotenv from "dotenv";
import { createServer } from "http";

import authRoutes from "./routes/authRoutes.js";
import tableRoutes from "./routes/tableRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import menuRoutes from "./routes/menuRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import publicRoutes from "./routes/publicRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";

import { initializeSocket } from "./lib/socket.js";
import { errorHandler } from "./middleware/errorHandler.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);

const port = Number(process.env.PORT) || 4000;

app.use(helmet());

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
  }),
);

app.use(morgan("dev"));

app.use(express.json());

initializeSocket(httpServer);

app.get("/health", (_req, res) => {
  return res.json({
    success: true,
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

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
  return res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

/**
 * Global Error Handler
 */
app.use(errorHandler);

if (process.env.NODE_ENV !== "test") {
  httpServer.listen(port, () => {
    console.log(`🚀 CafeOS Backend running on port ${port}`);
  });
}

export default app;