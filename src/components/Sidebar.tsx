import React from 'react';
import SidebarContent from './SidebarContent';

const Sidebar: React.FC = () => {
  return (
    <div className="w-64 flex-shrink-0 border-r border-border/50 backdrop-blur-md bg-white/50 dark:bg-gray-900/50 shadow-lg z-20">
      <SidebarContent />
    </div>
  );
};

export default Sidebar;