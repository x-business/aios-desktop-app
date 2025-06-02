import express, { Express } from "express";
import cors, { CorsOptions } from "cors";
import helmet from "helmet";
import morgan from "morgan";
import passport from "passport";

import { errorHandler } from "./middleware/errorHandler";
import "./config/auth"; // Initialize passport strategies

// Import routes
import authRoutes from "./routes/auth";
// import userRoutes from './routes/users';
import userRoutes from "./routes/users";
import apiKeyRoutes from "./routes/apiKeys";
import pointsRoutes from "./routes/points";
import billingRoutes from "./routes/billing";

const app: Express = express();

const corsOptions: CorsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
};

// Middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(passport.initialize());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/api-keys", apiKeyRoutes);
app.use("/api/points", pointsRoutes);
app.use("/api/billing", billingRoutes);

// Error handling middleware
app.use(errorHandler);

export default app;
