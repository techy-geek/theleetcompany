import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import passport from './config/passport';
import authRoutes from './routes/authRoutes';
import questionRoutes from './routes/questionRoutes';
import paymentRoutes from './routes/paymentRoutes';

const app = express();

// Set security HTTP headers
app.use(helmet());

// Webhook route must be before body parser
app.use('/api/payments/webhook', paymentRoutes);

// Body parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// Enable CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 100
});
app.use('/api', limiter);

// Initialize Passport
app.use(passport.initialize());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/payments', paymentRoutes);

// Base route
app.get('/', (req, res) => {
  res.send('API is running...');
});

export default app;
