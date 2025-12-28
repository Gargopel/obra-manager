import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ConfigItem {
  id: string;
  name: string;
}

interface ConfigData {
  serviceTypes: ConfigItem[];
  rooms: ConfigItem[];
  blocks: ConfigItem[];
  painters: ConfigItem[];
  openingTypes: ConfigItem[];
  doorTypes: ConfigItem[];
  contractors: ConfigItem[]; // Adicionando empreiteiros
}

const useConfigData = () => {
  return useQuery<ConfigData, Error>({
    queryKey: ['configData'],
    queryFn: async () => {
      const [serviceTypesResult, roomsResult, blocksResult, paintersResult, openingTypesResult, doorTypesResult, contractorsResult] = await Promise.all([
        supabase.from('service_types').select('id, name').order('name'),
        supabase.from('rooms').select('id, name').order('name'),
        supabase.from('blocks').select('id, name').order('name'),
        supabase.from('painters').select('id, name').order('name'),
        supabase.from('opening_types').select('id, name').order('name'),
        supabase.from('door_types').select('id, name').order('name'),
        supabase.from('contractors').select('id, name').order('name'), // Buscando empreiteiros
      ]);

      if (serviceTypesResult.error) throw new Error(serviceTypesResult.error.message);
      if (roomsResult.error) throw new Error(roomsResult.error.message);
      if (blocksResult.error) throw new Error(blocksResult.error.message);
      if (paintersResult.error) throw new Error(paintersResult.error.message);
      if (openingTypesResult.error) throw new Error(openingTypesResult.error.message);
      if (doorTypesResult.error) throw new Error(doorTypesResult.error.message);
      if (contractorsResult.error) throw new Error(contractorsResult.error.message);

      return {
        serviceTypes: serviceTypesResult.data as ConfigItem[],
        rooms: roomsResult.data as ConfigItem[],
        blocks: blocksResult.data as ConfigItem[],
        painters: paintersResult.data as ConfigItem[],
        openingTypes: openingTypesResult.data as ConfigItem[],
        doorTypes: doorTypesResult.data as ConfigItem[],
        contractors: contractorsResult.data as ConfigItem[], // Retornando empreiteiros
      };
    },
  });
};

export default useConfigData;