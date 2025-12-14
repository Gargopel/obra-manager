import React from 'react';
import { useSession } from '@/contexts/SessionContext';
import { Navigate, Outlet } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import Sidebar from './Sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileSidebar from './MobileSidebar';

const Layout: React.FC = () => {
  const { session, isLoading } = useSession();
  const isMobile = useIsMobile();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sidebar (Desktop) */}
      {!isMobile && <Sidebar />}
      
      <div className="flex-1 flex flex-col">
        {/* Mobile Header/Sidebar Trigger */}
        {isMobile && <MobileSidebar />}

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {/* Frutiger Aero inspired background effect */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <div className="w-96 h-96 bg-blue-400/30 dark:bg-blue-600/30 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob absolute top-10 left-10"></div>
            <div className="w-96 h-96 bg-pink-400/30 dark:bg-pink-600/30 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000 absolute bottom-10 right-10"></div>
          </div>

          <div className="relative z-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;