import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MeasurementDetail {
  id: string;
  user_id: string;
  block_id: string;
  location_type: string;
  apartment_number: string | null;
  floor_number: number | null;
  service_type_id: string | null;
  status: 'Aberta' | 'Conferida';
  result: 'Concluída' | 'Inconcluída' | null;
  notes: string | null;
  missing_details: string | null;
  checked_by_id: string | null;
  created_at: string;
  updated_at: string;
  service_type_name: string | null;
  requester_first_name: string | null;
  requester_last_name: string | null;
  checker_first_name: string | null;
  checker_last_name: string | null;
}

interface Filters {
  block_id?: string;
  status?: string;
  result?: string;
  service_type_id?: string;
}

const useMeasurements = (filters: Filters = {}) => {
  return useQuery<MeasurementDetail[], Error>({
    queryKey: ['measurements', filters],
    queryFn: async () => {
      let query = supabase
        .from('measurements_with_details')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters.block_id) query = query.eq('block_id', filters.block_id);
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.result) query = query.eq('result', filters.result);
      if (filters.service_type_id) query = query.eq('service_type_id', filters.service_type_id);

      const { data, error } = await query;
      if (error) throw error;
      return data as MeasurementDetail[];
    },
    refetchInterval: 10000,
  });
};

export default useMeasurements;