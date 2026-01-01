import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { dataService } from '../services/dataService';

interface AuthContextType {
  user: User | null;
  currentView: 'login' | 'pos' | 'admin';
  login: (u: User) => void;
  logout: () => void;
  setView: (view: 'login' | 'pos' | 'admin') => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setView] = useState<'login' | 'pos' | 'admin'>('login');
  const [isLoading, setIsLoading] = useState(true); // New loading state

  // --- NEW: Check for persisted login on mount ---
  useEffect(() => {
    const unsubscribe = dataService.onAuthStateChange((restoredUser) => {
      if (restoredUser) {
        setUser(restoredUser);
        // If we were on the login screen, move to POS. 
        // (If we want to persist the exact view 'admin'/'pos', we'd need localStorage, but this is safer for now)
        if (currentView === 'login') {
            setView('pos');
        }
      } else {
        setUser(null);
        setView('login');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = (u: User) => {
    setUser(u);
    setView('pos');
  };

  const logout = () => {
    dataService.logout(); // Ensure Firebase knows we logged out
    setUser(null);
    setView('login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, currentView, login, logout, setView, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};