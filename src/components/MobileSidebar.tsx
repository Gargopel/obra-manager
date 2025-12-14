import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import SidebarContent from './SidebarContent';

const MobileSidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden flex justify-between items-center p-4 bg-background/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-30">
      <div className="text-xl font-bold text-primary">Obra Manager</div>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0 border-r-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg">
          {/* Passa a função para fechar o sheet para o conteúdo da sidebar */}
          <SidebarContent onLinkClick={() => setIsOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default MobileSidebar;