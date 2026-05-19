import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();
const router = express.Router();

// Initialize the Razorpay SDK with our secret keys from .env
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID as string,
  key_secret: process.env.RAZORPAY_KEY_SECRET as string,
});

// @route   POST /api/payments/create-order
// @desc    Creates an order in Razorpay (Step 1)
router.post('/create-order', async (req, res) => {
  try {
    const options = {
      amount: 49 * 100, // Amount is in the smallest currency unit (paise). 49 * 100 = ₹49
      currency: 'INR',
      receipt: `receipt_order_${Math.random() * 1000}`,
    };

    const order = await razorpay.orders.create(options);
    
    // Send the order details to the frontend
    res.json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Something went wrong' });
  }
});

// @route   POST /api/payments/verify
// @desc    Verifies the digital signature from Razorpay (Step 3)
router.post('/verify', async (req, res) => {
  try {
    // 1. Get the signature and order details sent from the React frontend
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId } = req.body;

    // 2. We use Node's built-in crypto to create our own expected signature
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET as string)
      .update(sign.toString())
      .digest("hex");

    // 3. If our expected signature matches the one Razorpay sent, the payment is 100% authentic!
    if (razorpay_signature === expectedSign) {
      // Find the user in our DB and upgrade them to Premium!
      await User.findByIdAndUpdate(userId, { isPremium: true });
      
      return res.status(200).json({ message: "Payment verified successfully" });
    } else {
      return res.status(400).json({ message: "Invalid signature sent!" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error!" });
  }
});

export default router;
