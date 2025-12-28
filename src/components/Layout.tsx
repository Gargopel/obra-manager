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
  
  const mainBgUrl = siteConfig?.main_background_url 
    ? `${siteConfig.main_background_url}?quality=70`
    : undefined;
    
  const mainBgStyle = mainBgUrl
    ? { backgroundImage: `url(${mainBgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }
    : {};

  return (
    <div className="flex min-h-screen bg-background" style={mainBgStyle}>
      {!isMobile && <Sidebar />}
      
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {isMobile && <MobileSidebar />}

        <main className="flex-1 p-4 md:p-8 overflow-y-auto relative z-10">
          {!siteConfig?.main_background_url && (
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
              <div className="w-96 h-96 bg-blue-400/10 dark:bg-blue-600/10 rounded-full mix-blend-multiply filter blur-3xl opacity-50 absolute top-10 left-10"></div>
              <div className="w-96 h-96 bg-pink-400/10 dark:bg-pink-600/10 rounded-full mix-blend-multiply filter blur-3xl opacity-50 absolute bottom-10 right-10"></div>
            </div>
          )}

          <Outlet />
        </main>
        
        {!isMobile && <Footer />}
      </div>
    </div>
  );
};

export default Layout;