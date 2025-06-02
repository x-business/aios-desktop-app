import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { supabase } from './database';
import { userService } from '../models/User';

// JWT Strategy
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || 'default_jwt_secret',
};

passport.use(
  new JwtStrategy(jwtOptions, async (payload, done) => {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', payload.id)
        .single();

      if (error || !user) {
        return done(null, false);
      }
      return done(null, user);
    } catch (error) {
      return done(error, false);
    }
  })
);

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || '',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists
        const existingUser = await userService.findByGoogleId(profile.id);
        
        if (existingUser) {
          return done(null, existingUser);
        }

        // Create new user
        const newUser = await userService.create({
          googleId: profile.id,
          email: profile.emails?.[0].value || '',
          displayName: profile.displayName,
          profilePicture: profile.photos?.[0].value,
          pointsBalance: 0
        });

        return done(null, newUser);
      } catch (error) {
        return done(error, false);
      }
    }
  )
); 