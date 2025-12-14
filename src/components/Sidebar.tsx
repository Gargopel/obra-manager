import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ListChecks, Settings, LogOut, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';

const Sidebar: React.FC = () => {
  const { isAdmin, profile } = useSession();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      showError('Erro ao sair: ' + error.message);
    }
  };

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'Demandas', icon: ListChecks, path: '/demands' },
  ];

  if (isAdmin) {
    navItems.push({ name: 'Configurações', icon: Settings, path: '/settings' });
  }

  return (
    <div className="w-64 p-4 flex flex-col border-r border-border/50 backdrop-blur-md bg-white/50 dark:bg-gray-900/50 shadow-lg z-20">
      <div className="text-2xl font-bold mb-8 text-primary dark:text-primary-foreground">
        Obra Manager
      </div>
      
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="flex items-center p-3 rounded-lg text-sm font-medium text-foreground hover:bg-accent/70 transition-colors"
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.name}
          </Link>
        ))}
      </nav>

      <div className="mt-auto pt-4 border-t border-border/50">
        {profile && (
          <div className="mb-4 text-sm text-muted-foreground">
            Olá, {profile.first_name || 'Usuário'} ({profile.role})
          </div>
        )}
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

export default Sidebar;