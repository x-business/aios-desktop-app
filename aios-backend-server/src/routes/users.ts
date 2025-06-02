import { RequestHandler, Router } from 'express';
import { authenticateJwt } from '../middleware/auth';
import { getCurrentUser } from '../controllers/authController';

const router = Router();

// Get current user
router.get('/me', authenticateJwt, getCurrentUser as RequestHandler);

export default router; 