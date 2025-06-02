import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { AuthRequest } from '../types/auth';
import { User } from '../models/User';

// Authenticate JWT token
export const authenticateJwt = (req: Request, res: Response, next: NextFunction): void => {
  passport.authenticate("jwt", { session: false }, (err: Error, user: User) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    (req as AuthRequest).user = user;
    next();
  })(req, res, next);
};

// Authenticate with Google OAuth
export const authenticateGoogle = passport.authenticate('google', {
  scope: ['profile', 'email']
});

// Google OAuth callback
export const googleCallback = passport.authenticate('google', {
  session: false,
  failureRedirect: '/login'
}); 