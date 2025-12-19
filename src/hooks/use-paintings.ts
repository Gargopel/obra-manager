import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Filters {
  block_id?: string;
  apartment_number?: string;
  location?: string;
  status?: string;
  painter_id?: string; // We will filter by painter name if needed, but keeping ID structure for consistency
}

export interface PaintingDetail {
  id: string;
  user_id: string | null;
  block_id: string;
  apartment_number: string | null;
  location: 'Apartamento' | 'Sacada' | 'Banheiro' | 'Circulação';
  status: 'Em Andamento' | 'Finalizado' | 'Entregue';
  created_at: string;
  last_updated_at: string;
  painter_name: string;
}

const usePaintings = (filters: Filters) => {
  return useQuery<PaintingDetail[], Error>({
    queryKey: ['paintings', filters],
    queryFn: async () => {
      let query = supabase
        .from('paintings_with_details')
        .select('*')
        .order('last_updated_at', { ascending: false });

      if (filters.block_id) {
        query = query.eq('block_id', filters.block_id);
      }
      if (filters.apartment_number) {
        query = query.eq('apartment_number', filters.apartment_number);
      }
      if (filters.location) {
        query = query.eq('location', filters.location);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      // Note: Filtering by painter_id is complex since the view only exposes painter_name.
      // For now, we rely on filtering by other fields. If filtering by painter is critical,
      // we might need a separate query or update the view/hook logic.

      const { data, error } = await query;

      if (error) throw new Error(error.message);
      
      return data as PaintingDetail[];
    },
    refetchInterval: 10000,
  });
};

export default usePaintings;