import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Filters {
  block_id?: string;
  apartment_number?: string;
  floor_number?: number;
  door_type_id?: string;
  status?: string;
}

export interface DoorDetail {
  id: string;
  user_id: string | null;
  block_id: string;
  apartment_number: string;
  floor_number: number;
  door_type_id: string;
  status: 'Falta' | 'Instalada' | 'Corrigir' | 'Entregue' | 'Falta Arremate';
  created_at: string;
  last_updated_at: string;
  door_type_name: string;
}

const useDoors = (filters: Filters) => {
  return useQuery<DoorDetail[], Error>({
    queryKey: ['doors', filters],
    queryFn: async () => {
      let query = supabase
        .from('doors_with_details')
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
      if (filters.door_type_id) {
        query = query.eq('door_type_id', filters.door_type_id);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;

      if (error) throw new Error(error.message);
      
      return data as DoorDetail[];
    },
    refetchInterval: 10000,
  });
};

export default useDoors;