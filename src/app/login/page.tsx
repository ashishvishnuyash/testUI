import LoginForm from '@/components/auth/LoginForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login - TradeChat', // Updated title
  description: 'Log in to access TradeChat.', // Updated description
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary to-background p-4">
       <LoginForm />
    </div>
  );
}

