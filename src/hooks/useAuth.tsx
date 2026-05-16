import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { User } from '../types';

interface RegisterData {
  name: string;
  email: string;
  password: string;
  parentId?: string;
}

interface StoredUser extends RegisterData {}

interface AuthContextValue {
  user: User | null;
  login: (email: string, password: string) => { success: boolean; message: string };
  register: (data: RegisterData) => { success: boolean; message: string };
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const AUTH_STORAGE_KEY = 'mura-web-user';
const USERS_STORAGE_KEY = 'mura-web-users';

function loadStoredUsers(): StoredUser[] {
  try {
    const stored = window.localStorage.getItem(USERS_STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as StoredUser[];
  } catch {
    window.localStorage.removeItem(USERS_STORAGE_KEY);
    return [];
  }
}

function saveStoredUsers(users: StoredUser[]) {
  window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

function findStoredUser(email: string): StoredUser | undefined {
  const normalizedEmail = email.trim().toLowerCase();
  return loadStoredUsers().find((user) => user.email.trim().toLowerCase() === normalizedEmail);
}

function createSessionUser(storedUser: StoredUser): User {
  return {
    name: storedUser.name,
    email: storedUser.email,
    parentId: storedUser.parentId
  };
}

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
      login: (email: string, password: string) => {
        const storedUser = findStoredUser(email);
        if (!storedUser) {
          return { success: false, message: 'No account found. Please sign up first.' };
        }
        if (storedUser.password !== password) {
          return { success: false, message: 'Invalid email or password.' };
        }
        const nextUser = createSessionUser(storedUser);
        window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser));
        setUser(nextUser);
        return { success: true, message: 'Login successful.' };
      },
      register: (data: RegisterData) => {
        const existing = findStoredUser(data.email);
        if (existing) {
          return { success: false, message: 'An account with this email already exists.' };
        }
        const users = loadStoredUsers();
        users.push({ ...data });
        saveStoredUsers(users);
        return { success: true, message: 'Account created successfully. Please log in.' };
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
