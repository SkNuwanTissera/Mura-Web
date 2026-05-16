import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { User } from '../types';

interface AuthContextValue {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const AUTH_STORAGE_KEY = 'mura-web-user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      try {
        setUser(JSON.parse(stored) as User);
      } catch {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      login: (nextUser: User) => {
        window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser));
        setUser(nextUser);
      },
      logout: () => {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
        setUser(null);
      }
    }),
    [user]
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
