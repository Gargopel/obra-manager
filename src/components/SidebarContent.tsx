import React from 'react';
import { Link } from 'react-router-dom';
import { ListChecks, Settings, LogOut, LayoutDashboard, User, BrickWall, PaintBucket, DoorOpen, DoorClosed, Users, Ruler, CloudUpload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import useSiteConfig from '@/hooks/use-site-config';
import ThemeToggle from './ThemeToggle';
import NotificationBell from './NotificationBell';
import { useOfflineDemands } from '@/hooks/use-offline-demands';
import { Badge } from './ui/badge';

interface SidebarContentProps {
  onLinkClick?: () => void;
}

const SidebarContent: React.FC<SidebarContentProps> = ({ onLinkClick }) => {
  const { isAdmin, profile } = useSession();
  const { data: siteConfig } = useSiteConfig();
  const { drafts } = useOfflineDemands();
  
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) showError('Erro ao sair: ' + error.message);
  };

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'Demandas', icon: ListChecks, path: '/demands' },
    { name: 'Medição', icon: Ruler, path: '/measurements' },
    { name: 'Cerâmicas', icon: BrickWall, path: '/ceramics' },
    { name: 'Pinturas', icon: PaintBucket, path: '/paintings' },
    { name: 'Aberturas', icon: DoorOpen, path: '/openings' },
    { name: 'Portas', icon: DoorClosed, path: '/doors' },
    { name: 'Funcionários', icon: Users, path: '/employees' },
  ];

  if (isAdmin) {
    navItems.push({ name: 'Configurações', icon: Settings, path: '/settings' });
  }

  return (
    <div className="w-full h-full p-4 flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <div className="text-2xl font-bold text-primary dark:text-primary-foreground truncate">
          {siteConfig?.site_name || 'Obra Manager'}
        </div>
        <NotificationBell />
      </div>
      
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={onLinkClick}
            className="flex items-center p-3 rounded-lg text-sm font-medium text-foreground hover:bg-accent/70 transition-colors"
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.name}
          </Link>
        ))}

        <Link
          to="/sync"
          onClick={onLinkClick}
          className="flex items-center justify-between p-3 rounded-lg text-sm font-medium text-foreground hover:bg-accent/70 transition-colors relative"
        >
          <div className="flex items-center">
            <CloudUpload className="w-5 h-5 mr-3 text-blue-500" />
            Sincronizar
          </div>
          {drafts.length > 0 && (
            <Badge variant="destructive" className="animate-pulse h-5 w-5 flex items-center justify-center p-0 rounded-full">
              {drafts.length}
            </Badge>
          )}
        </Link>
      </nav>
      
      <div className="mt-auto pt-4 border-t border-border/50 space-y-2">
        <ThemeToggle />
        {profile && (
          <div className="pt-2 text-sm text-muted-foreground">
            Olá, {profile.first_name || 'Usuário'} ({profile.role})
          </div>
        )}
        <Link to="/profile" onClick={onLinkClick}>
          <Button variant="ghost" className="w-full justify-start">
            <User className="w-4 h-4 mr-2" />
            Meu Perfil
          </Button>
        </Link>
        <Button variant="ghost" className="w-full justify-start text-destructive hover:bg-destructive/10" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </Button>
      </div>
    </div>
  );
};

export default SidebarContent;