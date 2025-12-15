import React from 'react';
import { useSession } from '@/contexts/SessionContext';
import { Navigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { User, Lock } from 'lucide-react';
import UserProfile from '@/components/settings/UserProfile';

const ProfilePage: React.FC = () => {
  const { profile, isLoading } = useSession();
  
  if (isLoading) return null;
  
  if (!profile) {
    return (
      <Card className="p-8 text-center backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 shadow-xl border border-white/30 dark:border-gray-700/50">
        <Lock className="w-10 h-10 mx-auto mb-4 text-destructive" />
        <h2 className="text-2xl font-bold">Acesso Negado</h2>
        <p className="text-muted-foreground">Você precisa estar logado para acessar esta página.</p>
        <Navigate to="/login" replace />
      </Card>
    );
  }
  
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-foreground/90 backdrop-blur-sm p-2 rounded-lg">
        <User className="inline-block w-8 h-8 mr-2 text-primary" />
        Meu Perfil
      </h1>
      
      <UserProfile />
    </div>
  );
};

export default ProfilePage;