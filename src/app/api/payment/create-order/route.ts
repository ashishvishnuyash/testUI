import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeAdminApp } from '@/lib/firebase/admin';

// Initialize Firebase Admin
const app = initializeAdminApp();
const db = getFirestore(app);

// Razorpay credentials
const RAZORPAY_KEY_ID = "rzp_test_732qsLZ7cVKYCW";
const RAZORPAY_KEY_SECRET = "pq6ZydlJeRCH1xw6g6ylrOSj";

export async function POST(request: NextRequest) {
  try {
    // Get request body
    const body = await request.json();
    const { planId, amount, idToken } = body;
    
    if (!planId || !amount || !idToken) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Verify the user's Firebase ID token
    try {
      const decodedToken = await getAuth().verifyIdToken(idToken);
      const uid = decodedToken.uid;
      
      // Create a Razorpay order
      const orderData = {
        amount: amount * 100, // Convert to smallest currency unit
        currency: 'USD',
        receipt: `order_${uid}_${Date.now()}`,
        notes: {
          userId: uid,
          planId: planId
        }
      };
      
      // Make request to Razorpay API to create order
      const response = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64')
        },
        body: JSON.stringify(orderData)
      });
      
      const orderResponse = await response.json();
      
      if (!response.ok) {
        console.error('Razorpay order creation failed', orderResponse);
        return NextResponse.json({ error: 'Failed to create payment order' }, { status: 500 });
      }
      
      return NextResponse.json({ 
        orderId: orderResponse.id,
        amount: orderResponse.amount,
        currency: orderResponse.currency
      });
      
    } catch (error) {
      console.error('Authentication error:', error);
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }
    
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}