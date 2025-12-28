import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Filters {
  block_id?: string;
  apartment_number?: string;
  service_type_id?: string;
  room_id?: string;
  status?: string;
}

export interface DemandDetail {
  id: string;
  block_id: string;
  apartment_number: string;
  description: string;
  status: 'Pendente' | 'Resolvido';
  image_url: string | null;
  created_at: string;
  resolved_at: string | null;
  user_id: string;
  service_type_name: string;
  room_name: string;
  user_first_name: string | null;
  user_last_name: string | null;
  is_contractor_pending: boolean; // Novo campo
  contractor_id: string | null; // Novo campo
  contractor_name: string | null; // Novo campo (da view)
}

const useDemands = (filters: Filters) => {
  return useQuery<DemandDetail[], Error>({
    queryKey: ['demands', filters],
    queryFn: async () => {
      let query = supabase
        .from('demands_with_details')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters.block_id) {
        query = query.eq('block_id', filters.block_id);
      }
      if (filters.apartment_number) {
        query = query.eq('apartment_number', filters.apartment_number);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;

      if (error) throw new Error(error.message);
      
      return data as DemandDetail[];
    },
    refetchInterval: 10000,
  });
};

export default useDemands;