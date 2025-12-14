import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BLOCKS } from "@/utils/construction-structure";

interface Demand {
  id: string;
  status: 'Pendente' | 'Resolvido';
  created_at: string;
  resolved_at: string | null;
  block_id: string;
  service_types: { name: string };
}

interface DashboardData {
  totalDemands: number;
  pendingDemands: number;
  resolvedDemands: number;
  resolutionTimeAvg: string;
  completionPercentage: number;
  demandsByService: { name: string; count: number }[];
  demandsByBlock: { block: string; count: number }[];
}

const calculateResolutionTime = (demands: Demand[]): string => {
  const resolvedDemands = demands.filter(d => d.status === 'Resolvido' && d.resolved_at);
  
  if (resolvedDemands.length === 0) return 'N/A';

  let totalDurationMs = 0;
  resolvedDemands.forEach(d => {
    const created = new Date(d.created_at).getTime();
    const resolved = new Date(d.resolved_at!).getTime();
    totalDurationMs += resolved - created;
  });

  const averageDurationMs = totalDurationMs / resolvedDemands.length;
  
  // Convert average duration to days, hours, minutes
  const days = Math.floor(averageDurationMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((averageDurationMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((averageDurationMs % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const useDashboardData = () => {
  return useQuery<DashboardData, Error>({
    queryKey: ['dashboardData'],
    queryFn: async () => {
      const { data: demands, error } = await supabase
        .from('demands')
        .select('id, status, created_at, resolved_at, block_id, service_types(name)');

      if (error) throw new Error(error.message);

      const totalDemands = demands.length;
      const pendingDemands = demands.filter(d => d.status === 'Pendente').length;
      const resolvedDemands = totalDemands - pendingDemands;
      const completionPercentage = totalDemands > 0 ? Math.round((resolvedDemands / totalDemands) * 100) : 0;
      const resolutionTimeAvg = calculateResolutionTime(demands as Demand[]);

      // Demands by Service Type
      const serviceCounts = demands.reduce((acc, d) => {
        const serviceName = (d.service_types as { name: string }).name;
        acc[serviceName] = (acc[serviceName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const demandsByService = Object.entries(serviceCounts).map(([name, count]) => ({ name, count }));

      // Demands by Block
      const blockCounts = demands.reduce((acc, d) => {
        acc[d.block_id] = (acc[d.block_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      // Ensure all blocks are represented, even if count is 0
      const demandsByBlock = BLOCKS.map(block => ({
        block,
        count: blockCounts[block] || 0,
      }));

      return {
        totalDemands,
        pendingDemands,
        resolvedDemands,
        resolutionTimeAvg,
        completionPercentage,
        demandsByService,
        demandsByBlock,
      };
    },
    refetchInterval: 15000, // Refresh data every 15 seconds
  });
};

export default useDashboardData;