import { body, ValidationChain } from 'express-validator';

// Common validation chains
export const emailValidator: ValidationChain = body('email')
  .isEmail()
  .normalizeEmail()
  .withMessage('Must be a valid email address');

export const passwordValidator: ValidationChain = body('password')
  .isLength({ min: 8 })
  .withMessage('Password must be at least 8 characters long');

export const apiKeyValidator: ValidationChain = body('apiKey')
  .isString()
  .isLength({ min: 20 })
  .withMessage('API key must be at least 20 characters long'); 