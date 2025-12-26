import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Assignment } from "./use-employees"; // Reutilizando a interface Assignment

const fetchEmployeeAssignments = async (employeeId: string): Promise<Assignment[]> => {
  if (!employeeId) return [];
  
  const { data, error } = await supabase
    .from('assignments')
    .select(`
      *,
      service_types (name)
    `)
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  
  // Mapear o resultado para incluir service_type_name
  return data.map(a => ({
    ...a,
    service_type_name: (a.service_types as { name: string }).name,
  })) as Assignment[];
};

const useEmployeeAssignments = (employeeId: string | undefined) => {
  return useQuery<Assignment[], Error>({
    queryKey: ['employeeAssignments', employeeId],
    queryFn: () => fetchEmployeeAssignments(employeeId!),
    enabled: !!employeeId,
    refetchInterval: 10000,
  });
};

export default useEmployeeAssignments;