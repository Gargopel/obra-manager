import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CeramicLot {
  id: string;
  block_id: string;
  lot_number: string;
  manufacturer: string | null;
  product_name: string | null;
  purchase_date: string | null;
  created_at: string;
  location: 'Apartamentos' | 'Circulação' | 'Sacada'; // Novo campo
}

const fetchCeramicLotsByBlockId = async (blockId: string): Promise<CeramicLot[]> => {
  if (!blockId) return [];
  
  const { data, error } = await supabase
    .from('ceramic_lots')
    .select('*')
    .eq('block_id', blockId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as CeramicLot[];
};

const useCeramicLots = (blockId: string | undefined) => {
  return useQuery<CeramicLot[], Error>({
    queryKey: ['ceramicLots', blockId],
    queryFn: () => fetchCeramicLotsByBlockId(blockId!),
    enabled: !!blockId,
  });
};

export default useCeramicLots;