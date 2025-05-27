"use client";

import type { FormEvent } from 'react';
import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, initializationError } from '@/lib/firebase/config'; // Import initializationError
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import Link from 'next/link'; // Import Link
import { useRouter } from 'next/navigation'; // Import useRouter

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Initialize error state with potential Firebase initialization error
  const [error, setError] = useState<string | null>(initializationError);
  const [loading, setLoading] = useState(false);
  const router = useRouter(); // Initialize router

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    // Clear previous login attempt errors, but keep init error if it exists
    setError(initializationError);
    setLoading(true);

    // === Crucial Check: Verify 'auth' is not null ===
    if (!auth) {
        const errMsg = initializationError || "Authentication service is unavailable. Firebase might not be configured correctly or failed to initialize.";
        console.error("🔴 Login Error: Firebase Auth service (imported 'auth') is null. Cannot proceed.", {initializationError});
        setError(errMsg);
        setLoading(false);
        return; // Stop if auth service isn't available
    }
    console.log("✅ LoginForm: Auth service object appears available. Proceeding with Firebase call.");

    try {
      console.log("LoginForm: Attempting signInWithEmailAndPassword...");
      await signInWithEmailAndPassword(auth, email, password);
      console.log("🟢 LoginForm: signInWithEmailAndPassword successful.");
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
       console.log("LoginForm: handleLogin finished.");
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto mt-10 shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-serif text-primary">TradeChat Login</CardTitle> {/* Updated Title */}
        <CardDescription className="text-muted-foreground">Access market discussions and insights.</CardDescription> {/* Updated Description */}
      </CardHeader>
      <CardContent>
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
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-serif flex items-center justify-center gap-2" disabled={loading || !auth || !!initializationError}>
             {loading && <Loader2 className="h-4 w-4 animate-spin" />}
             {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
      </CardContent>
       <CardFooter className="text-center text-sm text-muted-foreground">
         <p>Don't have an account? <Link href="/signup" className={`font-medium ${initializationError ? 'text-muted-foreground pointer-events-none' : 'text-accent hover:underline'}`}>Sign Up</Link></p>
      </CardFooter>
    </Card>
  );
}
