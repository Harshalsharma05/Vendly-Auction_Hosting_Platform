import express from 'express';
import { register, login, getMe, logout } from '../controllers/auth.controller.js';
import { protect } from '../middlewares/authMiddleware.js';

import { registerValidation, validate } from '../validations/auth.validation.js';

const router = express.Router();

router.post('/register', registerValidation, validate, register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', protect, getMe);

export default router;