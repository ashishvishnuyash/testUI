"use client";

import type { FormEvent } from 'react';
import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, initializationError } from '@/lib/firebase/config'; // Import initializationError
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Import useRouter

export default function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // Initialize error state with potential Firebase initialization error
  const [error, setError] = useState<string | null>(initializationError);
  const [loading, setLoading] = useState(false);
  const router = useRouter(); // Initialize router

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
     // Clear previous signup attempt errors, but keep init error if it exists
    setError(initializationError);

    console.log("SignUpForm: handleSignUp triggered.");

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
    console.log(`[SignUpForm] Checking auth object before Firebase call. Is auth null? ${!auth}`, {initializationError});
    if (!auth) {
        const errMsg = initializationError || "Authentication service is unavailable. Firebase might not be configured correctly or failed to initialize.";
        console.error("🔴 SignUp Error: Firebase Auth service (imported 'auth') is null. Cannot proceed.", {initializationError});
        setError(errMsg);
        // setLoading(false); // Ensure loading is off if we error out here
        return; // Stop if auth service isn't available
    }
    console.log("✅ SignUpForm: Auth service object appears available. Proceeding with Firebase call.");


    setLoading(true); // Set loading true only after initial checks and auth confirmation

    try {
       console.log("SignUpForm: Attempting createUserWithEmailAndPassword...");
       // The error 'auth/configuration-not-found' typically happens here if the 'auth' object passed,
       // although not null, was derived from an incorrectly initialized FirebaseApp.
      await createUserWithEmailAndPassword(auth, email, password);
       console.log("🟢 SignUpForm: createUserWithEmailAndPassword successful.");
       // Sign up successful, Firebase listener in AuthProvider will handle the state change.
       // Redirect to the main chat interface page after successful sign up.
       router.push('/chat');
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
      console.log("SignUpForm: handleSignUp finished.");
      setLoading(false); // Ensure loading is stopped in finally block
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto mt-10 shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-serif text-primary">Create TradeChat Account</CardTitle> {/* Updated Title */}
        <CardDescription className="text-muted-foreground">Join TradeChat today.</CardDescription> {/* Updated Description */}
      </CardHeader>
      <CardContent>
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
      </CardContent>
       <CardFooter className="text-center text-sm text-muted-foreground">
         <p>Already have an account? <Link href="/login" className={`font-medium ${initializationError ? 'text-muted-foreground pointer-events-none' : 'text-accent hover:underline'}`}>Log In</Link></p>
      </CardFooter>
    </Card>
  );
}
