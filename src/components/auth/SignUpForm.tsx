"use client";

import type { FormEvent } from 'react';
import { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, sendEmailVerification } from 'firebase/auth';
import { auth, initializationError } from '@/lib/firebase/config'; // Import initializationError
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Import useRouter

export default function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // Initialize error state with potential Firebase initialization error
  const [error, setError] = useState<string | null>(initializationError);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const router = useRouter(); // Initialize router

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
     // Clear previous signup attempt errors, but keep init error if it exists
    setError(initializationError);

    // console.log("SignUpForm: handleSignUp triggered.");

    // Password checks first
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
        setError("Password must be at least 6 characters long.");
        return;
    }

    // === Crucial Check: Verify 'auth' is not null ===
    // Log the imported auth object's state right before attempting to use it.
    // console.log(`[SignUpForm] Checking auth object before Firebase call. Is auth null? ${!auth}`, {initializationError});
    if (!auth) {
        const errMsg = initializationError || "Authentication service is unavailable. Firebase might not be configured correctly or failed to initialize.";
        console.error("🔴 SignUp Error: Firebase Auth service (imported 'auth') is null. Cannot proceed.", {initializationError});
        setError(errMsg);
        // setLoading(false); // Ensure loading is off if we error out here
        return; // Stop if auth service isn't available
    }
    // console.log("✅ SignUpForm: Auth service object appears available. Proceeding with Firebase call.");

    setLoading(true); // Set loading true only after initial checks and auth confirmation

    try {
      //  console.log("SignUpForm: Attempting createUserWithEmailAndPassword...");
       // The error 'auth/configuration-not-found' typically happens here if the 'auth' object passed,
       // although not null, was derived from an incorrectly initialized FirebaseApp.
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // console.log("🟢 SignUpForm: createUserWithEmailAndPassword successful.");
      
      // Send email verification
      try {
        await sendEmailVerification(userCredential.user);
        // console.log("🟢 SignUpForm: Email verification sent successfully.");
        setEmailSent(true);
        setError(null);
      } catch (verificationError: any) {
        console.error("🔴 SignUpForm: Error sending email verification:", verificationError);
        setError("Account created but failed to send verification email. Please try to resend verification email.");
        setEmailSent(true); // Still show the verification UI
      }
    } catch (err: any) {
       console.error("🔴 SignUpForm: Error during createUserWithEmailAndPassword:", err);
       let errorMessage = 'Failed to create account. Please try again.';
        if (err.code === 'auth/email-already-in-use') {
            errorMessage = 'This email address is already in use.';
        } else if (err.code === 'auth/invalid-email') {
            errorMessage = 'Please enter a valid email address.';
        } else if (err.code === 'auth/weak-password') {
            errorMessage = 'Password is too weak. Please choose a stronger password.';
        } else if (err.code === 'auth/configuration-not-found') {
             // This error specifically indicates the Firebase app config passed to getAuth() or used by createUserWith... was missing or invalid
             errorMessage = 'Firebase configuration error (auth/configuration-not-found). The setup seems incorrect. Check environment variables and Firebase initialization in firebase/config.ts.';
             console.error("🔴 Firebase Config Error Code: auth/configuration-not-found. This likely means the 'auth' object passed to Firebase functions was invalidly configured. Verify initialization in src/lib/firebase/config.ts and check its console logs thoroughly.");
        } else if (err.code === 'auth/api-key-not-valid') {
             errorMessage = 'Firebase configuration error (auth/api-key-not-valid). Please check your API key in .env.local.';
             console.error("🔴 Firebase Config Error Code: auth/api-key-not-valid.");
        } else {
             // Log unexpected errors
             console.error(`Unexpected Firebase Auth Error Code: ${err.code}`, err);
        }
       setError(errorMessage);
    } finally {
      // console.log("SignUpForm: handleSignUp finished.");
      setLoading(false); // Ensure loading is stopped in finally block
    }
  };

  const handleResendVerification = async () => {
    if (!auth?.currentUser) {
      setError("No user found. Please try signing up again.");
      return;
    }

    setResendLoading(true);
    setError(null);

    try {
      await sendEmailVerification(auth.currentUser);
      // console.log("🟢 SignUpForm: Email verification resent successfully.");
      setError(null);
    } catch (err: any) {
      console.error("🔴 SignUpForm: Error resending email verification:", err);
      let errorMessage = 'Failed to resend verification email. Please try again.';
      
      if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please wait a moment before trying again.';
      }
      
      setError(errorMessage);
    } finally {
      setResendLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    // Clear previous errors, but keep init error if it exists
    setError(initializationError);

    // console.log("SignUpForm: handleGoogleSignUp triggered.");

    // === Crucial Check: Verify 'auth' is not null ===
    if (!auth) {
        const errMsg = initializationError || "Authentication service is unavailable. Firebase might not be configured correctly or failed to initialize.";
        console.error("🔴 Google SignUp Error: Firebase Auth service (imported 'auth') is null. Cannot proceed.", {initializationError});
        setError(errMsg);
        return; // Stop if auth service isn't available
    }
    // console.log("✅ SignUpForm: Auth service object appears available. Proceeding with Google sign-up.");

    setGoogleLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      // Optional: Add custom parameters
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      // console.log("SignUpForm: Attempting signInWithPopup (Google)...");
      const result = await signInWithPopup(auth, provider);
      // console.log("🟢 SignUpForm: Google sign-up successful.", result.user);
      
      // Google accounts are automatically verified, so we can redirect
      // Sign up successful, Firebase listener in AuthProvider will handle the state change.
      // Redirect to the main chat interface page after successful sign up.
      router.push('/chat');
    } catch (err: any) {
      console.error("🔴 SignUpForm: Error during Google sign-up:", err);
      let errorMessage = 'Failed to sign up with Google. Please try again.';
      
      if (err.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-up cancelled. Please try again.';
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
      // console.log("SignUpForm: handleGoogleSignUp finished.");
      setGoogleLoading(false);
    }
  };

  // If email verification was sent, show verification message
  if (emailSent) {
    return (
      <Card className="w-full max-w-md mx-auto mt-10 shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-8 h-8 text-accent" />
          </div>
          <CardTitle className="text-2xl font-serif text-primary">Check Your Email</CardTitle>
          <CardDescription className="text-muted-foreground">
            We've sent a verification link to <strong>{email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              Please check your email and click the verification link to activate your account. 
              You won't be able to sign in until your email is verified.
            </AlertDescription>
          </Alert>
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Didn't receive the email? Check your spam folder or
            </p>
            <Button 
              onClick={handleResendVerification}
              variant="outline"
              disabled={resendLoading}
              className="w-full font-serif"
            >
              {resendLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                'Resend Verification Email'
              )}
            </Button>
          </div>
        </CardContent>
        <CardFooter className="text-center text-sm text-muted-foreground">
          <p>
            Already verified? <Link href="/login" className="font-medium text-accent hover:underline">Sign In</Link>
          </p>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-10 shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-serif text-primary">Create StockWhisperer AI Account</CardTitle> {/* Updated Title */}
        <CardDescription className="text-muted-foreground">Join StockWhisperer AI today.</CardDescription> {/* Updated Description */}
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Google Sign Up Button */}
          <Button 
            type="button"
            onClick={handleGoogleSignUp}
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
            {googleLoading ? 'Signing up...' : 'Continue with Google'}
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

          {/* Email Sign Up Form */}
          <form onSubmit={handleSignUp} className="space-y-6">
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
                placeholder="•••••••• (min. 6 characters)"
                 className="focus:ring-accent"
                 disabled={!!initializationError} // Disable if Firebase init failed
              />
            </div>
             <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="font-serif">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="••••••••"
                 className="focus:ring-accent"
                 disabled={!!initializationError} // Disable if Firebase init failed
              />
            </div>
             {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
             {/* Disable button if auth service failed to initialize */}
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-serif flex items-center justify-center gap-2" disabled={loading || !auth || !!initializationError}>
               {loading && <Loader2 className="h-4 w-4 animate-spin" />}
               {loading ? 'Creating Account...' : 'Sign Up'}
            </Button>
          </form>
        </div>
      </CardContent>
       <CardFooter className="text-center text-sm text-muted-foreground">
         <p>Already have an account? <Link href="/login" className={`font-medium ${initializationError ? 'text-muted-foreground pointer-events-none' : 'text-accent hover:underline'}`}>Log In</Link></p>
      </CardFooter>
    </Card>
  );
}
