import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Filters {
  block_id?: string;
  apartment_number?: string;
  service_type_id?: string;
  room_id?: string;
  status?: string;
  is_contractor_pending?: boolean; // Novo filtro
  contractor_id?: string; // Novo filtro
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
  is_contractor_pending: boolean;
  contractor_id: string | null;
  contractor_name: string | null;
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
      if (filters.service_type_id) {
        query = query.eq('service_type_id', filters.service_type_id);
      }
      if (filters.room_id) {
        query = query.eq('room_id', filters.room_id);
      }
      
      // Aplicando novos filtros de empreiteiro
      if (filters.is_contractor_pending !== undefined) {
        query = query.eq('is_contractor_pending', filters.is_contractor_pending);
      }
      if (filters.contractor_id) {
        query = query.eq('contractor_id', filters.contractor_id);
      }

      const { data, error } = await query;

      if (error) throw new Error(error.message);
      
      return data as DemandDetail[];
    },
    refetchInterval: 10000,
  });
};

export default useDemands;