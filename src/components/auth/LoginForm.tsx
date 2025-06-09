"use client";

import type { FormEvent } from 'react';
import { useState } from 'react';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, sendEmailVerification } from 'firebase/auth';
import { auth, initializationError } from '@/lib/firebase/config'; // Import initializationError
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, AlertTriangle } from 'lucide-react';
import Link from 'next/link'; // Import Link
import { useRouter } from 'next/navigation'; // Import useRouter

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Initialize error state with potential Firebase initialization error
  const [error, setError] = useState<string | null>(initializationError);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showVerificationPrompt, setShowVerificationPrompt] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [unverifiedUserEmail, setUnverifiedUserEmail] = useState('');
  const router = useRouter(); // Initialize router

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    // Clear previous login attempt errors, but keep init error if it exists
    setError(initializationError);
    setShowVerificationPrompt(false);
    setLoading(true);

    // === Crucial Check: Verify 'auth' is not null ===
    if (!auth) {
        const errMsg = initializationError || "Authentication service is unavailable. Firebase might not be configured correctly or failed to initialize.";
        console.error("🔴 Login Error: Firebase Auth service (imported 'auth') is null. Cannot proceed.", {initializationError});
        setError(errMsg);
        setLoading(false);
        return; // Stop if auth service isn't available
    }
    // console.log("✅ LoginForm: Auth service object appears available. Proceeding with Firebase call.");

    try {
      // console.log("LoginForm: Attempting signInWithEmailAndPassword...");
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Check if email is verified
      if (!userCredential.user.emailVerified) {
        // console.log("🔴 LoginForm: Email not verified for user:", userCredential.user.email);
        setUnverifiedUserEmail(userCredential.user.email || email);
        setShowVerificationPrompt(true);
        setError("Please verify your email address before signing in. Check your inbox for a verification link.");
        
        // Sign out the user since they shouldn't be logged in without verification
        await auth.signOut();
        return;
      }
      
      // console.log("🟢 LoginForm: signInWithEmailAndPassword successful and email verified.");
      // Login successful, AuthProvider will handle redirect or state change
      // Redirect to the main chat interface page after successful login
      router.push('/chat');
    } catch (err: any) {
      console.error("🔴 LoginForm: Error during signInWithEmailAndPassword:", err);
      let errorMessage = 'Failed to login. Please try again.';
       if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
          errorMessage = 'Invalid email or password.';
       } else if (err.code === 'auth/invalid-email') {
           errorMessage = 'Please enter a valid email address.';
       } else if (err.code === 'auth/user-disabled') {
           errorMessage = 'This account has been disabled. Please contact support.';
       } else if (err.code === 'auth/too-many-requests') {
           errorMessage = 'Too many failed login attempts. Please try again later.';
       } else if (err.code === 'auth/configuration-not-found') {
             errorMessage = 'Firebase configuration error (auth/configuration-not-found). The setup seems incorrect. Check environment variables and Firebase initialization in firebase/config.ts.';
             console.error("🔴 Firebase Config Error Code: auth/configuration-not-found. This likely means the 'auth' object passed to Firebase functions was invalidly configured.");
        } else if (err.code === 'auth/api-key-not-valid') {
             errorMessage = 'Firebase configuration error (auth/api-key-not-valid). Please check your API key in .env.local.';
             console.error("🔴 Firebase Config Error Code: auth/api-key-not-valid.");
        } else {
             // Log unexpected errors
             console.error(`Unexpected Firebase Auth Error Code: ${err.code}`, err);
        }
      setError(errorMessage);
    } finally {
      //  console.log("LoginForm: handleLogin finished.");
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!unverifiedUserEmail) {
      setError("No email address found. Please try logging in again.");
      return;
    }

    setVerificationLoading(true);
    setError(null);

    try {
      // We need to sign in the user temporarily to send verification email
      const userCredential = await signInWithEmailAndPassword(auth!, unverifiedUserEmail, password);
      await sendEmailVerification(userCredential.user);
      
      // Sign out immediately after sending verification
      await auth!.signOut();
      
      // console.log("🟢 LoginForm: Email verification resent successfully.");
      setError("Verification email sent! Please check your inbox and click the verification link.");
    } catch (err: any) {
      console.error("🔴 LoginForm: Error resending email verification:", err);
      let errorMessage = 'Failed to resend verification email. Please try again.';
      
      if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please wait a moment before trying again.';
      } else if (err.code === 'auth/invalid-credential') {
        errorMessage = 'Unable to resend verification. Please try logging in again.';
        setShowVerificationPrompt(false);
      }
      
      setError(errorMessage);
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    // Clear previous errors, but keep init error if it exists
    setError(initializationError);
    setShowVerificationPrompt(false);

    // console.log("LoginForm: handleGoogleLogin triggered.");

    // === Crucial Check: Verify 'auth' is not null ===
    if (!auth) {
        const errMsg = initializationError || "Authentication service is unavailable. Firebase might not be configured correctly or failed to initialize.";
        console.error("🔴 Google Login Error: Firebase Auth service (imported 'auth') is null. Cannot proceed.", {initializationError});
        setError(errMsg);
        return; // Stop if auth service isn't available
    }
    // console.log("✅ LoginForm: Auth service object appears available. Proceeding with Google login.");

    setGoogleLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      // Optional: Add custom parameters
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      // console.log("LoginForm: Attempting signInWithPopup (Google)...");
      const result = await signInWithPopup(auth, provider);
      // console.log("🟢 LoginForm: Google login successful.", result.user);
      
      // Google accounts are automatically verified, so we can proceed
      // Login successful, AuthProvider will handle redirect or state change
      // Redirect to the main chat interface page after successful login
      router.push('/chat');
    } catch (err: any) {
      console.error("🔴 LoginForm: Error during Google login:", err);
      let errorMessage = 'Failed to login with Google. Please try again.';
      
      if (err.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Login cancelled. Please try again.';
      } else if (err.code === 'auth/popup-blocked') {
        errorMessage = 'Popup blocked by browser. Please allow popups and try again.';
      } else if (err.code === 'auth/account-exists-with-different-credential') {
        errorMessage = 'An account already exists with this email using a different sign-in method.';
      } else if (err.code === 'auth/configuration-not-found') {
        errorMessage = 'Firebase configuration error (auth/configuration-not-found). The setup seems incorrect. Check environment variables and Firebase initialization in firebase/config.ts.';
        console.error("🔴 Firebase Config Error Code: auth/configuration-not-found. This likely means the 'auth' object passed to Firebase functions was invalidly configured.");
      } else if (err.code === 'auth/api-key-not-valid') {
        errorMessage = 'Firebase configuration error (auth/api-key-not-valid). Please check your API key in .env.local.';
        console.error("🔴 Firebase Config Error Code: auth/api-key-not-valid.");
      } else {
        // Log unexpected errors
        console.error(`Unexpected Firebase Auth Error Code: ${err.code}`, err);
      }
      
      setError(errorMessage);
    } finally {
      // console.log("LoginForm: handleGoogleLogin finished.");
      setGoogleLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto mt-10 shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-serif text-primary">StockWhisperer AI Login</CardTitle> {/* Updated Title */}
        <CardDescription className="text-muted-foreground">Access market discussions and insights.</CardDescription> {/* Updated Description */}
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Google Login Button */}
          <Button 
            type="button"
            onClick={handleGoogleLogin}
            className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 font-serif flex items-center justify-center gap-3"
            disabled={googleLoading || !auth || !!initializationError}
          >
            {googleLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {googleLoading ? 'Signing in...' : 'Continue with Google'}
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
            </div>
          </div>

          {/* Email Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-serif">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="focus:ring-accent"
                disabled={!!initializationError} // Disable if Firebase init failed
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="font-serif">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                 className="focus:ring-accent"
                 disabled={!!initializationError} // Disable if Firebase init failed
              />
            </div>
             
             {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Email Verification Prompt */}
            {showVerificationPrompt && (
              <Alert>
                <Mail className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-3">
                    <p>Your email address needs to be verified before you can sign in.</p>
                    <Button 
                      onClick={handleResendVerification}
                      variant="outline"
                      size="sm"
                      disabled={verificationLoading}
                      className="w-full"
                    >
                      {verificationLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Sending...
                        </>
                      ) : (
                        'Resend Verification Email'
                      )}
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-serif flex items-center justify-center gap-2" disabled={loading || !auth || !!initializationError}>
               {loading && <Loader2 className="h-4 w-4 animate-spin" />}
               {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </div>
      </CardContent>
       <CardFooter className="text-center text-sm text-muted-foreground">
         <p>Don't have an account? <Link href="/signup" className={`font-medium ${initializationError ? 'text-muted-foreground pointer-events-none' : 'text-accent hover:underline'}`}>Sign Up</Link></p>
      </CardFooter>
    </Card>
  );
}
