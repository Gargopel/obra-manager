import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SiteConfig {
  id: string;
  site_name: string;
  main_background_url: string | null;
  login_background_url: string | null;
}

const useSiteConfig = () => {
  return useQuery<SiteConfig, Error>({
    queryKey: ['siteConfig'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_config')
        .select('*')
        .single();

      if (error) {
        // Fallback default config if table is empty or error occurs
        console.error("Error fetching site config, using defaults:", error);
        return {
          id: 'default',
          site_name: 'Obra Manager',
          main_background_url: null,
          login_background_url: null,
        } as SiteConfig;
      }
      
      return data as SiteConfig;
    },
    staleTime: 1000 * 60 * 5, // Config is unlikely to change often
  });
};

export default useSiteConfig;