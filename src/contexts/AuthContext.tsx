
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from "sonner";
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';

type AuthUser = {
  username: string;
  role: 'admin' | 'user';
};

type AuthContextType = {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demonstration - will be replaced by Supabase auth
const USERS = [
  { username: 'admin', password: 'admin123', role: 'admin' as const },
  { username: 'user', password: 'user123', role: 'user' as const }
];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session from Supabase
    const fetchSession = async () => {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error fetching session:', error);
        setIsLoading(false);
        return;
      }
      
      if (data && data.session) {
        handleSessionChange(data.session);
      }
      
      setIsLoading(false);
      
      // Set up listener for auth state changes
      const { data: authListener } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (session) {
            handleSessionChange(session);
          } else {
            setUser(null);
          }
        }
      );
      
      return () => {
        if (authListener?.subscription) {
          authListener.subscription.unsubscribe();
        }
      };
    };

    fetchSession();
  }, []);

  const handleSessionChange = async (session: Session) => {
    // For initial implementation, use the email as username and assign default role
    // In a real app, you would fetch user role from a users table
    if (session.user) {
      const userData = {
        username: session.user.email || session.user.id,
        // Default to 'user' role, but you can fetch from a database in production
        role: session.user.email?.includes('admin') ? 'admin' as const : 'user' as const
      };
      setUser(userData);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    // For backward compatibility during transition to Supabase
    const mockUser = USERS.find(u => 
      u.username.toLowerCase() === email.toLowerCase() && 
      u.password === password
    );
    
    if (mockUser) {
      // Mock user login for demonstration
      const userData = { username: mockUser.username, role: mockUser.role };
      setUser(userData);
      localStorage.setItem('hafta_user', JSON.stringify(userData));
      toast.success(`Welcome back, ${mockUser.username}!`);
      setIsLoading(false);
      return true;
    }
    
    // Real Supabase authentication
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('Login error:', error);
        toast.error(error.message || 'Invalid email or password');
        setIsLoading(false);
        return false;
      }
      
      if (data.user) {
        toast.success(`Welcome back, ${data.user.email || 'user'}!`);
        // User data will be set by the auth state change listener
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      toast.error('An unexpected error occurred');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    
    // Clear local storage for backward compatibility
    localStorage.removeItem('hafta_user');
    
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Logout error:', error);
      toast.error('Error logging out');
    } else {
      setUser(null);
      toast.info('You have been logged out');
    }
    
    setIsLoading(false);
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
