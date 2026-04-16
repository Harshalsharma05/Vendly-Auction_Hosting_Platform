import express from "express";
import cors from "cors";
import morgan from "morgan"; // HTTP request logger middleware
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import rateLimit from "express-rate-limit";

import { notFound, errorHandler } from "./middlewares/errorMiddleware.js";

import authRoutes from "./routes/auth.routes.js";
import clientRoutes from "./routes/client.routes.js";
import auctionRoutes from "./routes/auction.routes.js";
import itemRoutes from "./routes/item.routes.js";
import participantRoutes from "./routes/participant.routes.js";
import bidRoutes from "./routes/bid.routes.js";
import itemSubmissionRoutes from "./routes/itemSubmission.routes.js";

const app = express();

const defaultAllowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://vendly-auction-hosting-platform.vercel.app",
];

const envAllowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = [
  ...new Set([...defaultAllowedOrigins, ...envAllowedOrigins]),
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser clients (no origin header) and trusted browser origins.
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 204,
};

// --- SECURITY MIDDLEWARES ---

// Enable CORS before any API middleware so preflight requests always get headers.
app.use(cors(corsOptions));

// 1. Set Security HTTP Headers
app.use(helmet());

// 2. Rate Limiting (Limit each IP to 100 requests per 15 minutes)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 100 : 10000,
  skip: (req) => req.method === "OPTIONS",
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
});
app.use("/api", limiter); // Apply to all /api routes

// 3. Body Parser
app.use(express.json({ limit: "10kb" })); // Limit body payload to 10kb to prevent DOS attacks

// 4. Data Sanitization against NoSQL query injection
app.use((req, res, next) => {
  if (req.body) {
    req.body = mongoSanitize.sanitize(req.body);
  }

  if (req.params) {
    req.params = mongoSanitize.sanitize(req.params);
  }

  next();
});

// Handle preflight explicitly for all routes.
app.options(/.*/, cors(corsOptions));

// HTTP request logging
app.use(morgan("dev")); // Log HTTP requests in the console

// Health Check Route
app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "Vendly API is running..." });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/auctions", auctionRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/participants", participantRoutes);
app.use("/api/bids", bidRoutes);
app.use("/api/submissions", itemSubmissionRoutes);

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

export default app;

// Why separate app.js and server.js?
// app.js: Configures the Express application (middlewares, routes, error handlers) without starting the network listener. This makes writing integration tests much easier later on.
// server.js: Imports the app, sets up the HTTP server, attaches Socket.IO, and listens on the port.
