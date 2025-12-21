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
  painters: ConfigItem[]; // Adicionando pintores
  openingTypes: ConfigItem[]; // Adicionando tipos de aberturas
}

const useConfigData = () => {
  return useQuery<ConfigData, Error>({
    queryKey: ['configData'],
    queryFn: async () => {
      const [serviceTypesResult, roomsResult, blocksResult, paintersResult, openingTypesResult] = await Promise.all([
        supabase.from('service_types').select('id, name').order('name'),
        supabase.from('rooms').select('id, name').order('name'),
        supabase.from('blocks').select('id, name').order('name'),
        supabase.from('painters').select('id, name').order('name'), // Buscando pintores
        supabase.from('opening_types').select('id, name').order('name'), // Buscando tipos de aberturas
      ]);

      if (serviceTypesResult.error) throw new Error(serviceTypesResult.error.message);
      if (roomsResult.error) throw new Error(roomsResult.error.message);
      if (blocksResult.error) throw new Error(blocksResult.error.message);
      if (paintersResult.error) throw new Error(paintersResult.error.message);
      if (openingTypesResult.error) throw new Error(openingTypesResult.error.message);

      return {
        serviceTypes: serviceTypesResult.data as ConfigItem[],
        rooms: roomsResult.data as ConfigItem[],
        blocks: blocksResult.data as ConfigItem[],
        painters: paintersResult.data as ConfigItem[], // Retornando pintores
        openingTypes: openingTypesResult.data as ConfigItem[], // Retornando tipos de aberturas
      };
    },
  });
};

export default useConfigData;