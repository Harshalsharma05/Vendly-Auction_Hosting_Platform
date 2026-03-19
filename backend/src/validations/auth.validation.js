import { check, validationResult } from 'express-validator';

// Validation Rules
export const registerValidation =[
  check('name', 'Name is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
  check('role', 'Invalid role').optional().isIn(['admin', 'client', 'participant']),
];

// Middleware to catch validation errors
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Return a 400 Bad Request with the array of errors
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};