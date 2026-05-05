import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User as AppUser } from '@/types';

interface AuthContextType {
  user: AppUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogleIdToken: (token: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string, email: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Profile fetch error:', error.message);
        // Still set a basic user so auth flow isn't blocked
        setUser({
          id: userId,
          name: '',
          email,
          phone: '',
          loyaltyPoints: 0,
          tier: 'bronze',
          isAdmin: false,
        });
        return;
      }

      if (data) {
        setUser({
          id: userId,
          name: (data as any).name || '',
          email,
          phone: (data as any).phone || '',
          loyaltyPoints: (data as any).loyalty_points || 0,
          tier: (data as any).tier || 'bronze',
          isAdmin: false,
        });
      }
    } catch (err) {
      console.error('Profile fetch exception:', err);
      setUser({
        id: userId,
        name: '',
        email,
        phone: '',
        loyaltyPoints: 0,
        tier: 'bronze',
        isAdmin: false,
      });
    }
  };

  useEffect(() => {
    let isMounted = true;

    const syncUserFromSession = async (session: any) => {
      if (!isMounted) return;

      if (session?.user) {
        await fetchProfile(session.user.id, session.user.email || '');
      } else {
        setUser(null);
      }

      if (isMounted) {
        setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncUserFromSession(session);
    });

    void supabase.auth.getSession().then(({ data: { session } }) => {
      void syncUserFromSession(session);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };
    // Wait for profile to be fetched before returning success
    if (data.user) {
      await fetchProfile(data.user.id, data.user.email || '');
    }
    return { success: true };
  };

  const loginWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/browse',
      },
    });
  };

  const loginWithGoogleIdToken = async (token: string) => {
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token,
    });
    
    if (error) return { success: false, error: error.message };
    
    if (data.user) {
      await fetchProfile(data.user.id, data.user.email || '');
    }
    return { success: true };
  };

  const signup = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) return { success: false, error: error.message };
    // Wait for profile to be fetched before returning success
    if (data.user) {
      await fetchProfile(data.user.id, data.user.email || '');
    }
    return { success: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: false,
        login,
        loginWithGoogle,
        loginWithGoogleIdToken,
        signup,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
