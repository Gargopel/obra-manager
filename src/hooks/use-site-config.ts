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
      // Buscamos a primeira linha (deve haver apenas uma)
      const { data, error } = await supabase
        .from('site_config')
        .select('*')
        .limit(1)
        .maybeSingle(); // Usamos maybeSingle para lidar com 0 ou 1 resultado

      if (error) {
        console.error("Error fetching site config, using defaults:", error);
        throw new Error(error.message); // Lançar erro para que o useQuery o capture
      }
      
      if (!data) {
        // Se não houver dados (tabela vazia, apesar do INSERT inicial), retornamos um fallback sem ID para mutação
        return {
          id: 'fallback_no_data', // Usar um ID diferente de 'default' para evitar confusão, mas ainda inválido para mutação
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