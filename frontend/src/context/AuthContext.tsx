'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  profile?: {
    avatar: string;
    bio: string;
    xp: number;
    level: number;
    level_title: string;
    streak_days: number;
    theme: string;
    current_mode_id: string;
    current_world_id?: string;
    current_topic_id?: string;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, refreshToken: string, userData: any) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshUser = async () => {
    try {
      const token = localStorage.getItem('c2l_access_token');
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      const userData = await authApi.getMe();
      setUser(userData);
    } catch (err) {
      console.warn('Failed to fetch user:', err);
      localStorage.removeItem('c2l_access_token');
      localStorage.removeItem('c2l_refresh_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = (token: string, refreshToken: string, userData: any) => {
    localStorage.setItem('c2l_access_token', token);
    localStorage.setItem('c2l_refresh_token', refreshToken);
    setUser(userData);
    refreshUser();
  };

  const logout = () => {
    localStorage.removeItem('c2l_access_token');
    localStorage.removeItem('c2l_refresh_token');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
