import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "./supabase-client";

interface SupabaseAuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userBranch: number | null;
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: any }>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ user: User | null; error: any }>;
}

const SupabaseAuthContext = createContext<SupabaseAuthContextType | undefined>(undefined);

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userBranch, setUserBranch] = useState<number | null>(null);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        
        // Fetch user branch if user exists
        if (session?.user) {
          console.log('🔍 Fetching user data for email:', session.user.email);
          console.log('🔍 User ID:', session.user.id);
          try {
            // Add timeout to prevent hanging
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('User data fetch timeout')), 5000)
            );
            
            // Query using the authenticated user's email from the session
            const queryPromise = supabase
              .from('users')
              .select('id, email, branch_id')
              .eq('email', session.user.email)
              .maybeSingle();
            
            console.log('⏳ Waiting for user data query...');
            const { data: userData, error: userError } = await Promise.race([
              queryPromise,
              timeoutPromise
            ]) as any;
            
            console.log('✅ Query completed');
            
            if (userError) {
              console.error('❌ Error fetching user data:', userError);
              console.error('❌ Error details:', JSON.stringify(userError, null, 2));
              setUserBranch(null);
            } else if (!userData) {
              console.warn('⚠️ No user record found for email:', session.user.email);
              setUserBranch(null);
            } else {
              console.log('👤 User data fetched:', userData);
              setUserBranch(userData?.branch_id ?? null);
              console.log('👤 User branch set to:', userData?.branch_id);
            }
          } catch (err) {
            console.error('❌ Exception fetching user data:', err);
            console.error('❌ Will continue without branch filtering');
            setUserBranch(null);
          }
        } else {
          setUserBranch(null);
        }
      } catch (error) {
        console.error('❌ Error in getInitialSession:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        try {
          // Fetch user branch if user exists
          if (session?.user) {
            console.log('🔍 Fetching user data for email:', session.user.email);
            console.log('🔍 User ID:', session.user.id);
            try {
              // Query using the authenticated user's email from the session
              // The RLS policy will automatically filter based on JWT claims
              const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id, email, branch_id')
                .eq('email', session.user.email)
                .maybeSingle(); // Use maybeSingle instead of single to avoid error if no match
              
              if (userError) {
                console.error('❌ Error fetching user data:', userError);
                console.error('❌ This might be a Row Level Security (RLS) issue');
                // Continue anyway - user can still use the app without branch filtering
                setUserBranch(null);
              } else if (!userData) {
                console.warn('⚠️ No user record found for email:', session.user.email);
                console.warn('⚠️ User might not be registered in the users table');
                setUserBranch(null);
              } else {
                console.log('👤 User data fetched:', userData);
                setUserBranch(userData?.branch_id ?? null);
                console.log('👤 User branch set to:', userData?.branch_id);
              }
            } catch (err) {
              console.error('❌ Exception fetching user data:', err);
              setUserBranch(null);
            }
          } else {
            setUserBranch(null);
          }
        } catch (error) {
          console.error('❌ Error fetching user branch:', error);
        } finally {
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('❌ Sign in error:', error);
        return { user: null, error };
      }
      
      console.log('✅ Sign in successful:', data.user?.email);
      return { user: data.user, error: null };
    } catch (error) {
      console.error('❌ Sign in exception:', error);
      return { user: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) {
        console.error('❌ Sign up error:', error);
        return { user: null, error };
      }
      
      console.log('✅ Sign up successful:', data.user?.email);
      return { user: data.user, error: null };
    } catch (error) {
      console.error('❌ Sign up exception:', error);
      return { user: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ Sign out error:', error);
        throw error;
      }
      console.log('✅ Sign out successful');
    } catch (error) {
      console.error('❌ Sign out exception:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    session,
    loading,
    userBranch,
    signIn,
    signOut,
    signUp,
  };

  return (
    <SupabaseAuthContext.Provider value={value}>
      {children}
    </SupabaseAuthContext.Provider>
  );
}

export function useSupabaseAuth() {
  const context = useContext(SupabaseAuthContext);
  if (context === undefined) {
    throw new Error("useSupabaseAuth must be used within a SupabaseAuthProvider");
  }
  return context;
}
