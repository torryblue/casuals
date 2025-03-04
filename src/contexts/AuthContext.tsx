
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from "sonner";

type User = {
  username: string;
  role: 'admin' | 'user';
};

type AuthContextType = {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demonstration
const USERS = [
  { username: 'admin', password: 'admin123', role: 'admin' as const },
  { username: 'user', password: 'user123', role: 'user' as const }
];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem('hafta_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('hafta_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    // Simulate network request
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const foundUser = USERS.find(u => 
      u.username.toLowerCase() === username.toLowerCase() && 
      u.password === password
    );
    
    if (foundUser) {
      const userData = { username: foundUser.username, role: foundUser.role };
      setUser(userData);
      localStorage.setItem('hafta_user', JSON.stringify(userData));
      toast.success(`Welcome back, ${foundUser.username}!`);
      setIsLoading(false);
      return true;
    } else {
      toast.error('Invalid username or password');
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('hafta_user');
    toast.info('You have been logged out');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isAuthenticated: !!user,
      isLoading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
