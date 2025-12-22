import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SiteConfig {
  id: string;
  site_name: string;
  footer_text: string | null;
  main_background_url: string | null;
  login_background_url: string | null;
}

const useSiteConfig = () => {
  return useQuery<SiteConfig, Error>({
    queryKey: ['siteConfig'],
    queryFn: async () => {
      // Buscamos a primeira linha (deve haver apenas uma)
      const { data, error } = await supabase
        .from('site_config')
        .select('id, site_name, footer_text, main_background_url, login_background_url')
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error fetching site config, using defaults:", error);
        throw new Error(error.message);
      }
      
      if (!data) {
        // Se não houver dados, retornamos um fallback
        return {
          id: 'fallback_no_data',
          site_name: 'Obra Manager',
          footer_text: 'Desenvolvido por Dyad',
          main_background_url: null,
          login_background_url: null,
        } as SiteConfig;
      }
      
      // Garantir que footer_text tenha um valor padrão se for NULL no DB
      return {
        ...data,
        footer_text: data.footer_text || 'Desenvolvido por Dyad',
      } as SiteConfig;
    },
    // Removendo staleTime para garantir que a configuração seja sempre fresca após o deploy/login
    // staleTime: 1000 * 60 * 5, 
  });
};

export default useSiteConfig;