import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Filters {
  block_id?: string;
  apartment_number?: string;
  floor_number?: number;
  opening_type_id?: string;
  status?: string;
}

export interface OpeningDetail {
  id: string;
  user_id: string | null;
  block_id: string;
  apartment_number: string | null;
  floor_number: number | null;
  opening_type_id: string;
  status: 'Em Andamento' | 'Finalizado' | 'Entregue';
  created_at: string;
  last_updated_at: string;
  opening_type_name: string;
}

const useOpenings = (filters: Filters) => {
  return useQuery<OpeningDetail[], Error>({
    queryKey: ['openings', filters],
    queryFn: async () => {
      let query = supabase
        .from('openings_with_details')
        .select('*')
        .order('last_updated_at', { ascending: false });

      if (filters.block_id) {
        query = query.eq('block_id', filters.block_id);
      }
      if (filters.apartment_number) {
        query = query.eq('apartment_number', filters.apartment_number);
      }
      if (filters.floor_number !== undefined) {
        query = query.eq('floor_number', filters.floor_number);
      }
      if (filters.opening_type_id) {
        query = query.eq('opening_type_id', filters.opening_type_id);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;

      if (error) throw new Error(error.message);
      
      return data as OpeningDetail[];
    },
    refetchInterval: 10000,
  });
};

export default useOpenings;