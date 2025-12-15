import React, { createContext, useState, useEffect, useContext } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: 'Admin' | 'Membro';
  position: string | null; // Adicionando position
  avatar_url: string | null; // Adicionando avatar_url
}

interface SessionContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAdmin: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

const fetchProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, role, position, avatar_url') // Incluindo novos campos
    .eq('id', userId)
    .single();
  
  if (error) {
    console.error('Error fetching profile:', error);
    showError('Erro ao carregar perfil do usuário.');
    return null;
  }
  
  return data as Profile;
};

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          const userProfile = await fetchProfile(currentSession.user.id);
          setProfile(userProfile);
        } else {
          setProfile(null);
        }
        
        setIsLoading(false);
      }
    );
    
    // Fetch initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (initialSession) {
        setSession(initialSession);
        setUser(initialSession.user);
        fetchProfile(initialSession.user.id).then(setProfile);
      }
      setIsLoading(false);
    });
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);
  
  const isAdmin = profile?.role === 'Admin';
  
  return (
    <SessionContext.Provider value={{ session, user, profile, isLoading, isAdmin }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};