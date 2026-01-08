import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DemandDetail } from "./use-demands";

export interface ScheduleItem {
  id: string;
  schedule_id: string;
  block_id: string;
  floor_number: number | null;
  apartment_number: string | null;
  service_type_id: string | null;
}

export interface Schedule {
  id: string;
  user_id: string;
  title: string;
  deadline: string;
  created_at: string;
  status: string;
  user_name?: string;
  items?: ScheduleItem[];
}

export interface ScheduleProgress {
  totalDemands: number;
  resolvedDemands: number;
  pendingDemands: number;
  progressPercentage: number;
  avgResolutionTime: string;
  isExpired: boolean;
  daysRemaining: number;
  statusColor: string;
  statusText: string;
}

const fetchSchedules = async (userId?: string, isAdmin: boolean = false): Promise<Schedule[]> => {
  // Fazemos o join com profiles para pegar o nome do criador
  let query = supabase
    .from('schedules')
    .select(`
      *,
      profiles:user_id (first_name, last_name)
    `)
    .order('created_at', { ascending: false });
  
  if (!isAdmin && userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;
  if (error) throw error;

  return data.map(s => {
    const profile = s.profiles as any;
    return {
      ...s,
      user_name: profile ? `${profile.first_name} ${profile.last_name}` : 'N/A'
    };
  }) as Schedule[];
};

export const useSchedules = (userId?: string, isAdmin: boolean = false) => {
  return useQuery({
    queryKey: ['schedules', userId, isAdmin],
    queryFn: () => fetchSchedules(userId, isAdmin),
    enabled: !!userId, // Só executa se tivermos o ID do usuário
    refetchInterval: 30000,
  });
};

export const useScheduleDetails = (scheduleId: string | undefined) => {
  return useQuery({
    queryKey: ['schedule', scheduleId],
    queryFn: async () => {
      if (!scheduleId) return null;
      
      const { data: schedule, error: sError } = await supabase
        .from('schedules')
        .select(`
          *,
          profiles:user_id (first_name, last_name),
          schedule_items (*)
        `)
        .eq('id', scheduleId)
        .single();
      
      if (sError) throw sError;

      const { data: demands, error: dError } = await supabase
        .from('demands_with_details')
        .select('*');
      
      if (dError) throw dError;

      const items = schedule.schedule_items as ScheduleItem[];
      const relatedDemands = demands.filter(demand => {
        return items.some(item => {
          const matchBlock = demand.block_id === item.block_id;
          const matchFloor = item.floor_number ? demand.apartment_number?.startsWith(item.floor_number.toString()) : true;
          const matchApt = item.apartment_number ? demand.apartment_number === item.apartment_number : true;
          const matchService = item.service_type_id ? demand.service_type_id === item.service_type_id : true;
          
          return matchBlock && matchFloor && matchApt && matchService;
        });
      });

      const total = relatedDemands.length;
      const resolved = relatedDemands.filter(d => d.status === 'Resolvido').length;
      const pending = total - resolved;
      const progress = total > 0 ? Math.round((resolved / total) * 100) : 0;
      
      const deadlineDate = new Date(schedule.deadline);
      const now = new Date();
      const diffTime = deadlineDate.getTime() - now.getTime();
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const isExpired = daysRemaining < 0;

      const resolvedWithDates = relatedDemands.filter(d => d.status === 'Resolvido' && d.resolved_at);
      let avgTime = 'N/A';
      if (resolvedWithDates.length > 0) {
        const totalMs = resolvedWithDates.reduce((acc, d) => {
          return acc + (new Date(d.resolved_at!).getTime() - new Date(d.created_at).getTime());
        }, 0);
        const avgMs = totalMs / resolvedWithDates.length;
        avgTime = `${Math.round(avgMs / (1000 * 60 * 60))}h`;
      }

      let statusText = 'No Prazo';
      let statusColor = 'text-green-500';
      
      if (isExpired && progress < 100) {
        statusText = 'Atrasado';
        statusColor = 'text-red-500';
      } else if (daysRemaining <= 3 && progress < 100) {
        statusText = 'Prazo Crítico';
        statusColor = 'text-yellow-500';
      } else if (progress === 100) {
        statusText = 'Concluído';
        statusColor = 'text-blue-500';
      }

      const profile = schedule.profiles as any;
      return {
        schedule: {
          ...schedule,
          user_name: profile ? `${profile.first_name} ${profile.last_name}` : 'N/A'
        } as Schedule,
        demands: relatedDemands as DemandDetail[],
        stats: {
          totalDemands: total,
          resolvedDemands: resolved,
          pendingDemands: pending,
          progressPercentage: progress,
          avgResolutionTime: avgTime,
          isExpired,
          daysRemaining,
          statusText,
          statusColor
        } as ScheduleProgress
      };
    },
    enabled: !!scheduleId,
    refetchInterval: 15000
  });
};