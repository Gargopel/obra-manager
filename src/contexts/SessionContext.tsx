import React, { createContext, useState, useEffect, useContext } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: 'Admin' | 'Membro';
  position: string | null;
  avatar_url: string | null;
  can_measure?: boolean;
}

interface SessionContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAdmin: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Função para buscar o perfil de forma segura
    const fetchProfile = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        
        if (error) throw error;
        if (mounted) setProfile(data as Profile);
      } catch (err) {
        console.error('Erro ao carregar perfil:', err);
        if (mounted) setProfile(null);
      }
    };

    // O onAuthStateChange cuida do estado inicial (INITIAL_SESSION) 
    // e de todas as mudanças subsequentes.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!mounted) return;

      console.log(`Auth Event: ${event}`);
      setSession(currentSession);
      
      if (currentSession) {
        await fetchProfile(currentSession.user.id);
      } else {
        setProfile(null);
      }

      // Só paramos o loading após processar o evento inicial
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    isLoading,
    isAdmin: profile?.role === 'Admin'
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession deve ser usado dentro de um SessionProvider');
  }
  return context;
};