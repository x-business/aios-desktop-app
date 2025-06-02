import { RequestHandler, Router } from 'express';
import passport from 'passport';
import { signup, googleAuthCallback, getCurrentUser, logout, login } from '../controllers/authController';
import { authenticateJwt } from '../middleware/auth';
import { Request, Response, NextFunction } from 'express';

const router = Router();

// Google OAuth routes
router.get('/google',
  (req: Request, res: Response, next: NextFunction) => {
    const state = req.query.state;
    passport.authenticate('google', { 
      scope: ['profile', 'email'],
      session: false,
      state: state as string // Pass through the state parameter
    })(req, res, next);
  }
);

router.get('/google/callback',
  passport.authenticate('google', { 
    session: false,
    failureRedirect: '/signin',
    keepSessionInfo: true // Ensure state is preserved
  }),
  googleAuthCallback
);

// User routes
router.get('/me', authenticateJwt, getCurrentUser as RequestHandler);
router.post('/logout', logout);

// Add signup route
router.post('/signup', signup);

// Add login route
router.post('/login', login);

export default router; 