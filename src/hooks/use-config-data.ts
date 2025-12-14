import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ConfigItem {
  id: string;
  name: string;
}

interface ConfigData {
  serviceTypes: ConfigItem[];
  rooms: ConfigItem[];
}

const useConfigData = () => {
  return useQuery<ConfigData, Error>({
    queryKey: ['configData'],
    queryFn: async () => {
      const [serviceTypesResult, roomsResult] = await Promise.all([
        supabase.from('service_types').select('id, name').order('name'),
        supabase.from('rooms').select('id, name').order('name'),
      ]);

      if (serviceTypesResult.error) throw new Error(serviceTypesResult.error.message);
      if (roomsResult.error) throw new Error(roomsResult.error.message);

      return {
        serviceTypes: serviceTypesResult.data as ConfigItem[],
        rooms: roomsResult.data as ConfigItem[],
      };
    },
  });
};

export default useConfigData;