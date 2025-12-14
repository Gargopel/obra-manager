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
  service_types: { name: string };
  rooms: { name: string };
  profiles: { first_name: string | null; last_name: string | null } | null;
}

const useDemands = (filters: Filters) => {
  return useQuery<DemandDetail[], Error>({
    queryKey: ['demands', filters],
    queryFn: async () => {
      let query = supabase
        .from('demands')
        .select(`
          *,
          service_types(name),
          rooms(name),
          profiles(first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      // Apply filters dynamically
      if (filters.block_id) {
        query = query.eq('block_id', filters.block_id);
      }
      if (filters.apartment_number) {
        query = query.eq('apartment_number', filters.apartment_number);
      }
      if (filters.service_type_id) {
        query = query.eq('service_type_id', filters.service_type_id);
      }
      if (filters.room_id) {
        query = query.eq('room_id', filters.room_id);
      }
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