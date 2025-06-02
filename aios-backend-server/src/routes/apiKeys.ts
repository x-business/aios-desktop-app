import { Router } from 'express';
import { RequestHandler } from 'express';
import { authenticateJwt } from '../middleware/auth';
import { getUserApiKeys, addApiKey, deleteApiKey, updateApiKeyStatus } from '../controllers/apiKeyController';
import { body } from 'express-validator';
import { validate } from '../middleware/validation';
import { AuthRequest } from '../types/auth';

const router = Router();

// Get all API keys for a user
router.get('/', authenticateJwt, getUserApiKeys as RequestHandler);

// Add a new API key
router.post(
  '/',
  authenticateJwt,
  validate([
    body('provider').isString().notEmpty().withMessage('Provider is required'),
    body('key').isString().notEmpty().withMessage('API key is required'),
    body('name').optional().isString()
  ]),
  addApiKey as RequestHandler
);

// Delete an API key
router.delete('/:id', authenticateJwt, deleteApiKey as RequestHandler);

// Update API key status
router.patch(
  '/:id/status',
  authenticateJwt,
  validate([
    body('isActive').isBoolean().withMessage('isActive must be a boolean')
  ]),
  updateApiKeyStatus as RequestHandler
);

export default router; 