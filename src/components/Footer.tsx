import useSiteConfig from '@/hooks/use-site-config';
import React from 'react';

export const Footer = () => {
  const { data: siteConfig } = useSiteConfig();
  
  const footerText = siteConfig?.footer_text || 'Desenvolvido por Dyad';
  
  return (
    <div className="p-4 text-center mt-8 border-t border-border/50 bg-background/50 backdrop-blur-sm">
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
        {footerText}
      </p>
      <a
        href="https://www.dyad.sh/"
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        Made with Dyad
      </a>
    </div>
  );
};