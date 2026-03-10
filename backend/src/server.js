import dotenv from "dotenv";
dotenv.config();
import http from "http";
import app from "./app.js";
import connectDB from "./config/database.js";

// 1. Connect to Database
connectDB();

// 2. Create HTTP Server (We do this so we can attach Socket.IO later)
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;

// 3. Start Listening
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
