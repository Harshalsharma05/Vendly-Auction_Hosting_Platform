import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

export const socketAuth = async (socket, next) => {
  try {
    let token;

    // 1. Try to get token from Socket.IO auth payload (Standard approach)
    if (socket.handshake.auth && socket.handshake.auth.token) {
      token = socket.handshake.auth.token;
    } 
    // 2. Try to get token from standard HTTP headers
    else if (socket.handshake.headers.authorization && socket.handshake.headers.authorization.startsWith('Bearer')) {
      token = socket.handshake.headers.authorization.split(' ')[1];
    } 
    // 3. Try to get token from URL query parameters (How Postman is currently sending it!)
    else if (socket.handshake.query && socket.handshake.query.authorization) {
      const queryAuth = socket.handshake.query.authorization;
      token = queryAuth.startsWith('Bearer ') ? queryAuth.split(' ')[1] : queryAuth;
    } 
    else if (socket.handshake.query && socket.handshake.query.token) {
      token = socket.handshake.query.token;
    }

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user and attach to socket instance
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }

    socket.user = user;
    next();
  } catch (error) {
    console.error("Socket Auth Error:", error.message);
    next(new Error('Authentication error: Invalid or expired token'));
  }
};