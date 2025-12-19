import React, { useEffect } from 'react';
import { Settings, Users, Wrench, Home, Lock, User, Building, Globe, BrickWall } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ManageUsers from '@/components/settings/ManageUsers';
import ManageConfig from '@/components/settings/ManageConfig';
import { Card } from '@/components/ui/card';
import UserProfile from '@/components/settings/UserProfile';
import ManageBlocks from '@/components/settings/ManageBlocks';
import ManageSiteConfig from '@/components/settings/ManageSiteConfig';
import ManageCeramicLots from '@/components/settings/ManageCeramicLots'; // Importando o novo componente

const SettingsPage: React.FC = () => {
  const { isAdmin, isLoading } = useSession();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Extrair parâmetro 'tab' da URL
  const urlParams = new URLSearchParams(location.search);
  const initialTab = urlParams.get('tab') || 'profile';
  
  if (isLoading) return null; // Wait for session loading
  
  if (!isAdmin) {
    return (
      <Card className="p-8 text-center backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 shadow-xl border border-white/30 dark:border-gray-700/50">
        <Lock className="w-10 h-10 mx-auto mb-4 text-destructive" />
        <h2 className="text-2xl font-bold">Acesso Negado</h2>
        <p className="text-muted-foreground">Você não tem permissão de Administrador para acessar esta página.</p>
        <Navigate to="/" replace />
      </Card>
    );
  }
  
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-foreground/90 backdrop-blur-sm p-2 rounded-lg">
        <Settings className="inline-block w-8 h-8 mr-2 text-primary" />
        Configurações do Sistema
      </h1>
      
      <Tabs defaultValue={initialTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-7 backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 border border-white/30 dark:border-gray-700/50">
          <TabsTrigger value="profile" className="flex items-center"><User className="w-4 h-4 mr-2" /> Perfil</TabsTrigger>
          <TabsTrigger value="users" className="flex items-center"><Users className="w-4 h-4 mr-2" /> Usuários</TabsTrigger>
          <TabsTrigger value="blocks" className="flex items-center"><Building className="w-4 h-4 mr-2" /> Blocos</TabsTrigger>
          <TabsTrigger value="services" className="flex items-center"><Wrench className="w-4 h-4 mr-2" /> Serviços</TabsTrigger>
          <TabsTrigger value="rooms" className="flex items-center"><Home className="w-4 h-4 mr-2" /> Cômodos</TabsTrigger>
          <TabsTrigger value="ceramic-lots" className="flex items-center"><BrickWall className="w-4 h-4 mr-2" /> Lotes Cerâmica</TabsTrigger>
          <TabsTrigger value="site" className="flex items-center"><Globe className="w-4 h-4 mr-2" /> Site</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="mt-6">
          <UserProfile />
        </TabsContent>
        
        <TabsContent value="users" className="mt-6">
          <ManageUsers />
        </TabsContent>
        
        <TabsContent value="blocks" className="mt-6">
          <ManageBlocks />
        </TabsContent>
        
        <TabsContent value="services" className="mt-6">
          <ManageConfig 
            configType="service_types" 
            title="Gerenciar Tipos de Serviço" 
            icon={Wrench} 
          />
        </TabsContent>
        
        <TabsContent value="rooms" className="mt-6">
          <ManageConfig 
            configType="rooms" 
            title="Gerenciar Cômodos" 
            icon={Home} 
          />
        </TabsContent>
        
        <TabsContent value="ceramic-lots" className="mt-6">
          <ManageCeramicLots />
        </TabsContent>
        
        <TabsContent value="site" className="mt-6">
          <ManageSiteConfig />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;