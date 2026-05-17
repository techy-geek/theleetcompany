import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { protect, AuthRequest } from '../middlewares/auth';
import User from '../models/User';
import dotenv from 'dotenv';

dotenv.config();
const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'PLACEHOLDER_KEY',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'PLACEHOLDER_SECRET',
});

// @route   POST /api/payments/create-order
// @desc    Create a Razorpay order
// @access  Private
router.post('/create-order', protect, async (req: AuthRequest, res) => {
  try {
    const options = {
      amount: 99900, // Amount in paise (e.g., 999 INR)
      currency: 'INR',
      receipt: `receipt_order_${req.user?._id}`,
    };

    const order = await razorpay.orders.create(options);

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating order' });
  }
});

// @route   POST /api/payments/webhook
// @desc    Razorpay webhook to fulfill order
// @access  Public (Requires raw body for signature verification)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'PLACEHOLDER_WEBHOOK_SECRET';
    const shasum = crypto.createHmac('sha256', secret);
    
    // req.body is a buffer because of express.raw
    shasum.update(req.body);
    const digest = shasum.digest('hex');

    if (digest === req.headers['x-razorpay-signature']) {
      const event = JSON.parse(req.body.toString());

      if (event.event === 'payment.captured') {
        const payment = event.payload.payment.entity;
        
        // Find user by email from notes (we should pass email in notes when creating order in frontend, or look up by another identifier)
        const email = payment.notes?.email || payment.email; 
        
        if (email) {
          await User.findOneAndUpdate({ email }, { isPremium: true });
          console.log(`User ${email} upgraded to premium via webhook`);
        }
      }

      res.status(200).json({ status: 'ok' });
    } else {
      res.status(400).json({ message: 'Invalid signature' });
    }
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ message: 'Webhook error' });
  }
});

export default router;
