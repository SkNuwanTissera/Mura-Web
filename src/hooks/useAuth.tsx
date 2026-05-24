import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { User } from '../types';
import { loginUser, signupUser, googleSignInWithToken } from '../api';
import { authorizeWithGoogle } from '../googleAuth';
import { clearAuth, getStoredUser, persistAuth } from '../authStorage';

interface RegisterData {
  name: string;
  email: string;
  password: string;
}

interface AuthContextValue {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  googleLogin: () => Promise<{ success: boolean; message: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getStoredUser());

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  const value = useMemo(
    () => ({
      user,
      login: async (email: string, password: string) => {
        try {
          const nextUser = await loginUser(email.trim(), password);
          persistAuth(nextUser);
          setUser(nextUser);
          return { success: true, message: 'Login successful.' };
        } catch (error) {
          return { success: false, message: error instanceof Error ? error.message : 'Login failed.' };
        }
      },
      googleLogin: async () => {
        if (!googleClientId) {
          return { success: false, message: 'Google sign-in is not configured.' };
        }

        try {
          const idToken = await authorizeWithGoogle(googleClientId);
          const nextUser = await googleSignInWithToken(idToken);
          persistAuth(nextUser);
          setUser(nextUser);
          return { success: true, message: 'Signed in with Google.' };
        } catch (error) {
          return { success: false, message: error instanceof Error ? error.message : 'Google sign-in failed.' };
        }
      },
      register: async (data: RegisterData) => {
        try {
          await signupUser(data.name.trim(), data.email.trim(), data.password);
          return { success: true, message: 'Account created successfully. Please log in.' };
        } catch (error) {
          return { success: false, message: error instanceof Error ? error.message : 'Registration failed.' };
        }
      },
      logout: () => {
        clearAuth();
        setUser(null);
      }
    }),
    [user, googleClientId]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
