import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from '../models/User.js';
dotenv.config();
const router = express.Router();

const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET as string, {
    expiresIn: '30d'
  })
}

// 1. The route to trigger the Google login screen
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// 2. The callback route where Google sends the user after successful login
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    const user = req.user as any;
    const token = generateToken(user._id.toString()); // Generate the VIP wristband

    // Set the secure, HTTP-only cookie
    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.redirect('http://localhost:3000/questions'); // Redirect back to React frontend
  }
);

router.get('/me', async (req, res) => {
  try {
    const token = req.cookies.jwt;
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };

    // Find the user (include googleId temporarily for picture backfill)
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return user without googleId
    const { googleId, ...safeUser } = user.toObject();
    res.json(safeUser);
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

router.get('/logout', (req, res) => {
  res.clearCookie('jwt', {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  res.json({ message: 'Logged out successfully' });
});

export default router;
