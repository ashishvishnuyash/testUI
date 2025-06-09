import { useContext } from 'react';
import { AuthContext, type AuthContextType } from '@/components/auth/AuthProvider';

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  // The context now includes user, loading, and authError
  return context;
};
