import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeAdminApp } from '@/lib/firebase/admin';
import crypto from 'crypto';

// Initialize Firebase Admin
const app = initializeAdminApp();
const db = getFirestore(app);

// Razorpay credentials
const RAZORPAY_KEY_SECRET = "pq6ZydlJeRCH1xw6g6ylrOSj";

export async function POST(request: NextRequest) {
  try {
    // Get request body
    const body = await request.json();
    const { 
      razorpay_payment_id, 
      razorpay_order_id, 
      razorpay_signature,
      planId,
      idToken 
    } = body;
    
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !planId || !idToken) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Verify the user's Firebase ID token
    try {
      const decodedToken = await getAuth().verifyIdToken(idToken);
      const uid = decodedToken.uid;
      
      // Verify Razorpay signature
      const generatedSignature = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');
      
      if (generatedSignature !== razorpay_signature) {
        return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
      }
      
      // Payment is verified, update user's subscription in Firestore
      const userRef = db.collection('users').doc(uid);
      
      // Get the subscription end date (1 month from now)
      const now = new Date();
      const subscriptionEndDate = new Date(now.setMonth(now.getMonth() + 1));
      
      await userRef.set({
        subscription: {
          planId: planId,
          status: 'active',
          startDate: new Date(),
          endDate: subscriptionEndDate,
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id
        }
      }, { merge: true });
      
      return NextResponse.json({ 
        success: true,
        message: 'Payment verified and subscription updated',
        subscription: {
          planId,
          status: 'active',
          endDate: subscriptionEndDate
        }
      });
      
    } catch (error) {
      console.error('Authentication or verification error:', error);
      return NextResponse.json({ error: 'Authentication or verification failed' }, { status: 401 });
    }
    
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}