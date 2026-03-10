import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { notFound, errorHandler } from './middlewares/errorMiddleware.js';

const app = express();

// Middlewares
app.use(express.json()); // Parse incoming JSON payloads
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(morgan('dev')); // Log HTTP requests in the console

// Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Vendly API is running...' });
});

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

export default app;







// Why separate app.js and server.js?
// app.js: Configures the Express application (middlewares, routes, error handlers) without starting the network listener. This makes writing integration tests much easier later on.
// server.js: Imports the app, sets up the HTTP server, attaches Socket.IO, and listens on the port.