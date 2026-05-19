"use client";

import { useState } from 'react';
import api from '../lib/axios';
import { useAuth } from '../context/AuthContext';

// We tell TypeScript about the Razorpay global object
declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PaymentButton() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    if (!user) {
      alert('Please log in first!');
      return;
    }
    setLoading(true);

    try {
      // Step 1: Create a Razorpay order on our backend
      const { data: order } = await api.post('/payments/create-order');

      // Step 2: Open the Razorpay checkout popup with the order details
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // Your Razorpay KEY ID (not secret)
        amount: order.amount,
        currency: order.currency,
        name: 'TheLeetCompany',
        description: 'Premium Membership',
        order_id: order.id,

        // Step 3: This runs after the user pays successfully
        handler: async (response: any) => {
          try {
            // Send the payment proof to our backend to verify and unlock premium
            await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              userId: user._id,
            });

            alert('🎉 Payment successful! You are now a Premium member. Refreshing...');
            window.location.reload(); // Reload to re-fetch the user's premium status
          } catch (error) {
            alert('Payment verification failed. Please contact support.');
          }
        },

        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: {
          color: '#6366f1', // Indigo - matches our app theme
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Payment failed:', error);
      alert('Could not initiate payment. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={loading}
      className="inline-flex items-center gap-2 text-xs font-semibold bg-[#0F172A] text-white px-4 py-2 rounded-lg hover:bg-[#1E293B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <>
          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Processing...
        </>
      ) : (
        <>⚡ Upgrade — ₹49</>
      )}
    </button>
  );
}
