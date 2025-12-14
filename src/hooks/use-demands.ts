import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Filters {
  block_id?: string;
  apartment_number?: string;
  service_type_id?: string;
  room_id?: string;
  status?: string;
}

// Definindo a estrutura de dados que vem da View
export interface DemandDetail {
  id: string;
  block_id: string;
  apartment_number: string;
  description: string;
  status: 'Pendente' | 'Resolvido';
  image_url: string | null;
  created_at: string;
  resolved_at: string | null;
  user_id: string; // Adicionado user_id para referência
  service_type_name: string;
  room_name: string;
  user_first_name: string | null;
  user_last_name: string | null;
}

const useDemands = (filters: Filters) => {
  return useQuery<DemandDetail[], Error>({
    queryKey: ['demands', filters],
    queryFn: async () => {
      let query = supabase
        .from('demands_with_details') // Usando a nova View
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters dynamically (Note: filters based on IDs still work if the View includes them)
      if (filters.block_id) {
        query = query.eq('block_id', filters.block_id);
      }
      if (filters.apartment_number) {
        query = query.eq('apartment_number', filters.apartment_number);
      }
      // Filtering by service_type_id and room_id requires these columns in the view, 
      // but since the view only returns names, we might lose filtering capability by ID.
      // For now, we will keep the ID filters commented out as the view doesn't expose them directly.
      // If filtering by ID is critical, the view needs to be updated to include service_type_id and room_id.
      
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;

      if (error) throw new Error(error.message);
      
      return data as DemandDetail[];
    },
    refetchInterval: 10000, // Keep data fresh
  });
};

export default useDemands;