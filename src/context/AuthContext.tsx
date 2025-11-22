// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthUser, PasswordAuth } from '../services/auth/passwordAuth';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  register: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isRegistered: () => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  updateEmail: (newEmail: string, password: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const u = await PasswordAuth.getCurrentUser();
      setUser(u);
      setLoading(false);
    })();
  }, []);

  const register = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await PasswordAuth.register(email, password);
      const loginResult = await PasswordAuth.login(email, password);
      if (loginResult.success) {
        const u = await PasswordAuth.getCurrentUser();
        setUser(u);
      }
      return loginResult;
    } catch (err: any) {
      return { success: false, error: err?.message || 'Erreur lors de l\'inscription' };
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const result = await PasswordAuth.login(email, password);
    if (result.success) {
      const u = await PasswordAuth.getCurrentUser();
      setUser(u);
    }
    return result;
  };

  const logout = async () => {
    await PasswordAuth.logout();
    setUser(null);
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    return await PasswordAuth.changePassword(currentPassword, newPassword);
  };

  const updateEmail = async (newEmail: string, password: string) => {
    const result = await PasswordAuth.updateEmail(newEmail, password);
    if (result.success) {
      const u = await PasswordAuth.getCurrentUser();
      setUser(u);
    }
    return result;
  };

  const isRegistered = async () => PasswordAuth.isRegistered();

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout, isRegistered, changePassword, updateEmail }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
