import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileSidebar from './MobileSidebar';
import useSiteConfig from '@/hooks/use-site-config';
import { Footer } from './Footer';

const Layout: React.FC = () => {
  const { data: siteConfig } = useSiteConfig();
  const isMobile = useIsMobile();
  
  // Otimizando a URL da imagem de fundo
  const mainBgUrl = siteConfig?.main_background_url 
    ? `${siteConfig.main_background_url}?width=1200&quality=60` 
    : undefined;
    
  // IMPORTANTE: Removido 'fixed' que causa lag extremo no scroll e toque mobile
  const mainBgStyle = mainBgUrl
    ? { 
        backgroundImage: `linear-gradient(rgba(255,255,255,0.9), rgba(255,255,255,0.9)), url(${mainBgUrl})`, 
        backgroundSize: 'cover', 
        backgroundPosition: 'center' 
      }
    : {};

  return (
    <div className="flex min-h-screen bg-background" style={mainBgStyle}>
      {!isMobile && <Sidebar />}
      
      <div className="flex-1 flex flex-col relative">
        {isMobile && <MobileSidebar />}

        <main className="flex-1 p-4 md:p-8 overflow-x-hidden relative z-10">
          <Outlet />
        </main>
        
        {!isMobile && <Footer />}
      </div>
    </div>
  );
};

export default Layout;