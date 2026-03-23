import dotenv from "dotenv";
dotenv.config();

import http from "http";
import { Server } from "socket.io"; // <-- Import Socket.IO
import app from "./app.js";
import connectDB from "./config/database.js";
import { socketAuth } from "./middlewares/socketAuthMiddleware.js"; // <-- Import Auth
import { setupAuctionSockets } from "./sockets/auction.socket.js"; // <-- Import Handlers

// 1. Connect to Database
connectDB();

// 2. Create HTTP Server
const server = http.createServer(app);

// 3. Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*", // In production, restrict this to your frontend domain
    methods: ["GET", "POST"],
  },
});

// 4. Apply Socket Authentication Middleware
io.use(socketAuth);

// 5. Setup Auction Event Listeners
setupAuctionSockets(io);

// Make io available inside REST controllers via req.app.get('io')
app.set("io", io);

// We export `io` so we can use it inside our REST controllers later if needed!
export { io };

const PORT = process.env.PORT || 5000;

// 6. Start Listening
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
