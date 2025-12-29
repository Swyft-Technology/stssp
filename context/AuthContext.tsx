import React, { createContext, useContext, useState } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  currentView: 'login' | 'pos' | 'admin';
  login: (u: User) => void;
  logout: () => void;
  setView: (view: 'login' | 'pos' | 'admin') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setView] = useState<'login' | 'pos' | 'admin'>('login');

  const login = (u: User) => {
    setUser(u);
    setView('pos');
  };

  const logout = () => {
    setUser(null);
    setView('login');
  };

  return (
    <AuthContext.Provider value={{ user, currentView, login, logout, setView }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};