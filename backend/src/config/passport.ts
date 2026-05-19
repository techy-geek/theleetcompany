import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js'; // Notice the .js extension here!
import dotenv from 'dotenv';

dotenv.config();

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID as string,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
  callbackURL: process.env.GOOGLE_CALLBACK_URL as string
},
  async (accessToken, refreshToken, profile, done) => {
    try {
      // 1. Check if we already have this user in our Database
      let user = await User.findOne({ googleId: profile.id });

      // If they exist, log them in!
      if (user) { 
        const pic = profile.photos?.[0]?.value || '';
        if (pic && user.picture !== pic) {
          user.picture = pic;
          await user.save();
        }
        return done(null, user);
      }

      // 2. If they don't exist, create a new User document in MongoDB
      const email = profile.emails?.[0]?.value;

      if (!email) {
        return done(new Error("No email found"), undefined);
      }
      user = await User.create({
        googleId: profile.id,
        email,
        name: profile.displayName,
        picture: profile.photos?.[0]?.value || '',
        isPremium: false
      });// Log the new user in
      done(null, user);
    } catch (error) {
      done(error, undefined);
    }
  }
));

export default passport;
