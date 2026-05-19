"use client"; // Required for Context in Next.js App Router

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/axios';

// Define the shape of our User
interface User {
  _id: string;
  name: string;
  email: string;
  picture: string;
  isPremium: boolean;
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // When the app loads, ask the backend if we are logged in!
    const checkAuth = async () => {
      try {
        const res = await api.get('/auth/me');
        setUser(res.data);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = () => {
    // Redirects the browser to our backend Google OAuth route
    window.location.href = 'http://localhost:5000/api/auth/google';
  };

  const logout = async () => {
    try {
      await api.get('/auth/logout');
      setUser(null);
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// A custom hook to easily use our auth context anywhere!
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
