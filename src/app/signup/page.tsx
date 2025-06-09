import SignUpForm from '@/components/auth/SignUpForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up - StockWhisperer AI', // Updated title
  description: 'Create your account for StockWhisperer AI.', // Updated description
};

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary to-background p-4">
       <SignUpForm />
    </div>
  );
}

