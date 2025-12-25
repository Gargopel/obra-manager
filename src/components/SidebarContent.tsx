import React from 'react';
import { Link } from 'react-router-dom';
import { ListChecks, Settings, LogOut, LayoutDashboard, User, BrickWall, PaintBucket, DoorOpen, DoorClosed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import useSiteConfig from '@/hooks/use-site-config';
import ThemeToggle from './ThemeToggle'; // Importando ThemeToggle

interface SidebarContentProps {
  onLinkClick?: () => void;
}

const SidebarContent: React.FC<SidebarContentProps> = ({ onLinkClick }) => {
  const { isAdmin, profile } = useSession();
  const { data: siteConfig } = useSiteConfig();
  
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      showError('Erro ao sair: ' + error.message);
    }
  };

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'Demandas', icon: ListChecks, path: '/demands' },
    { name: 'Cerâmicas', icon: BrickWall, path: '/ceramics' },
    { name: 'Pinturas', icon: PaintBucket, path: '/paintings' },
    { name: 'Aberturas', icon: DoorOpen, path: '/openings' },
    { name: 'Portas', icon: DoorClosed, path: '/doors' }, // Novo item de navegação
  ];

  if (isAdmin) {
    navItems.push({ name: 'Configurações', icon: Settings, path: '/settings' });
  }

  return (
    <div className="w-full h-full p-4 flex flex-col">
      <div className="text-2xl font-bold mb-8 text-primary dark:text-primary-foreground">
        {siteConfig?.site_name || 'Obra Manager'}
      </div>
      
      <nav className="flex-1 space-y-2">
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
      </nav>
      
      <div className="mt-auto pt-4 border-t border-border/50 space-y-2">
        
        {/* Theme Toggle */}
        <ThemeToggle />
        
        {profile && (
          <div className="pt-2 text-sm text-muted-foreground">
            Olá, {profile.first_name || 'Usuário'} ({profile.role})
          </div>
        )}
        
        {/* Botão Meu Perfil */}
        <Link to="/profile" onClick={onLinkClick}>
          <Button variant="ghost" className="w-full justify-start">
            <User className="w-4 h-4 mr-2" />
            Meu Perfil
          </Button>
        </Link>
        
        <Button 
          variant="ghost" 
          className="w-full justify-start text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </Button>
      </div>
    </div>
  );
};

export default SidebarContent;