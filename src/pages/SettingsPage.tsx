import React, { useEffect } from 'react';
import { Settings, Users, Wrench, Home, Lock, User, Building, Globe, BrickWall, PaintBucket, DoorOpen, DoorClosed, HardHat, FileText, QrCode } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { Navigate, useLocation } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import ManageUsers from '@/components/settings/ManageUsers';
import ManageConfig from '@/components/settings/ManageConfig';
import ManageServiceTypes from '@/components/settings/ManageServiceTypes';
import { Card } from '@/components/ui/card';
import UserProfile from '@/components/settings/UserProfile';
import ManageBlocks from '@/components/settings/ManageBlocks';
import ManageSiteConfig from '@/components/settings/ManageSiteConfig';
import ManageCeramicLots from '@/components/settings/ManageCeramicLots';
import ManagePainters from '@/components/settings/ManagePainters';
import ManageOpeningTypes from '@/components/settings/ManageOpeningTypes';
import ManageDoorTypes from '@/components/settings/ManageDoorTypes';
import ManageContractors from '@/components/settings/ManageContractors';
import ManageUnitQRCodes from '@/components/settings/ManageUnitQRCodes'; // Novo
import useSiteConfig from '@/hooks/use-site-config';
import { exportManualToPdf } from '@/utils/pdf-export';

const SettingsPage: React.FC = () => {
  const { isAdmin, isLoading } = useSession();
  const { data: siteConfig } = useSiteConfig();
  const location = useLocation();
  
  const urlParams = new URLSearchParams(location.search);
  const initialTab = urlParams.get('tab') || 'profile';
  
  React.useEffect(() => {
    if (siteConfig?.site_name) {
      document.title = siteConfig.site_name + ' - Configurações';
    }
  }, [siteConfig]);
  
  if (isLoading) return null;
  
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
  
  const handleDownloadManual = () => {
    exportManualToPdf(siteConfig?.site_name);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-foreground/90 backdrop-blur-sm p-2 rounded-lg">
          <Settings className="inline-block w-8 h-8 mr-2 text-primary" />
          Configurações do Sistema
        </h1>
        <Button variant="outline" onClick={handleDownloadManual} className="backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 border border-white/30 dark:border-gray-700/50">
          <FileText className="w-4 h-4 mr-2" /> Baixar Manual (PDF)
        </Button>
      </div>
      
      <Tabs defaultValue={initialTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-12 backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 border border-white/30 dark:border-gray-700/50">
          <TabsTrigger value="profile"><User className="w-4 h-4 mr-2" /> Perfil</TabsTrigger>
          <TabsTrigger value="users"><Users className="w-4 h-4 mr-2" /> Usuários</TabsTrigger>
          <TabsTrigger value="blocks"><Building className="w-4 h-4 mr-2" /> Blocos</TabsTrigger>
          <TabsTrigger value="services"><Wrench className="w-4 h-4 mr-2" /> Serviços</TabsTrigger>
          <TabsTrigger value="rooms"><Home className="w-4 h-4 mr-2" /> Cômodos</TabsTrigger>
          <TabsTrigger value="painters"><PaintBucket className="w-4 h-4 mr-2" /> Pintores</TabsTrigger>
          <TabsTrigger value="contractors"><HardHat className="w-4 h-4 mr-2" /> Empreit.</TabsTrigger>
          <TabsTrigger value="ceramic-lots"><BrickWall className="w-4 h-4 mr-2" /> Cerâm.</TabsTrigger>
          <TabsTrigger value="opening-types"><DoorOpen className="w-4 h-4 mr-2" /> Abert.</TabsTrigger>
          <TabsTrigger value="door-types"><DoorClosed className="w-4 h-4 mr-2" /> Portas</TabsTrigger>
          <TabsTrigger value="qrcodes"><QrCode className="w-4 h-4 mr-2" /> QR Codes</TabsTrigger>
          <TabsTrigger value="site"><Globe className="w-4 h-4 mr-2" /> Site</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="mt-6"><UserProfile /></TabsContent>
        <TabsContent value="users" className="mt-6"><ManageUsers /></TabsContent>
        <TabsContent value="blocks" className="mt-6"><ManageBlocks /></TabsContent>
        <TabsContent value="services" className="mt-6"><ManageServiceTypes /></TabsContent>
        <TabsContent value="rooms" className="mt-6"><ManageConfig configType="rooms" title="Gerenciar Cômodos" icon={Home} /></TabsContent>
        <TabsContent value="painters" className="mt-6"><ManagePainters /></TabsContent>
        <TabsContent value="contractors" className="mt-6"><ManageContractors /></TabsContent>
        <TabsContent value="ceramic-lots" className="mt-6"><ManageCeramicLots /></TabsContent>
        <TabsContent value="opening-types" className="mt-6"><ManageOpeningTypes /></TabsContent>
        <TabsContent value="door-types" className="mt-6"><ManageDoorTypes /></TabsContent>
        <TabsContent value="qrcodes" className="mt-6"><ManageUnitQRCodes /></TabsContent>
        <TabsContent value="site" className="mt-6"><ManageSiteConfig /></TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;