import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RATING_CRITERIA } from "@/utils/construction-structure";

export interface Employee {
  id: string;
  name: string;
  type: 'ACPO' | 'Terceirizado';
  company_name: string | null;
  created_at: string;
}

export interface Assignment {
  id: string;
  employee_id: string;
  service_type_id: string;
  service_type_name: string;
  status: 'Em Andamento' | 'Finalizado';
  location_type: string;
  block_id: string;
  apartment_number: string | null;
  floor_number: number | null;
  finished_at: string | null;
  rating_speed: number | null;
  rating_quality: number | null;
  rating_cleanliness: number | null;
  rating_organization: number | null;
}

export interface EmployeeWithStats extends Employee {
  totalAssignments: number;
  completedAssignments: number;
  averageRatings: Record<typeof RATING_CRITERIA[number], number | null>;
}

interface Filters {
  service_type_id?: string;
  name_search?: string;
}

const fetchEmployeesAndAssignments = async (filters: Filters): Promise<EmployeeWithStats[]> => {
  // 1. Fetch Employees (filtered by name if necessary)
  let employeeQuery = supabase
    .from('employees')
    .select('*')
    .order('name');
    
  if (filters.name_search) {
    employeeQuery = employeeQuery.ilike('name', `%${filters.name_search}%`);
  }
  
  const { data: employeesData, error: employeesError } = await employeeQuery;
  if (employeesError) throw employeesError;
  
  // 2. Fetch Assignments (filtered by service type if necessary)
  let assignmentQuery = supabase
    .from('assignments')
    .select(`
      *,
      service_types (name)
    `);
    
  if (filters.service_type_id) {
    assignmentQuery = assignmentQuery.eq('service_type_id', filters.service_type_id);
  }
  
  const { data: assignmentsData, error: assignmentsError } = await assignmentQuery;
  if (assignmentsError) throw assignmentsError;

  // 3. Process Assignments and calculate statistics
  const employeeStats = new Map<string, { total: number, completed: number, ratings: Record<typeof RATING_CRITERIA[number], number[]> }>();

  employeesData.forEach(e => {
    employeeStats.set(e.id, {
      total: 0,
      completed: 0,
      ratings: { speed: [], quality: [], cleanliness: [], organization: [] }
    });
  });

  assignmentsData.forEach(a => {
    const stats = employeeStats.get(a.employee_id);
    if (stats) {
      stats.total += 1;
      if (a.status === 'Finalizado') {
        stats.completed += 1;
        
        RATING_CRITERIA.forEach(criterion => {
          if (a[`rating_${criterion}`] !== null) {
            stats.ratings[criterion].push(a[`rating_${criterion}`] as number);
          }
        });
      }
    }
  });

  // 4. Combine and calculate averages
  const results: EmployeeWithStats[] = employeesData.map(employee => {
    const stats = employeeStats.get(employee.id)!;
    
    const averageRatings: Record<typeof RATING_CRITERIA[number], number | null> = {} as any;
    
    RATING_CRITERIA.forEach(criterion => {
      const ratings = stats.ratings[criterion];
      if (ratings.length > 0) {
        const sum = ratings.reduce((acc, val) => acc + val, 0);
        averageRatings[criterion] = parseFloat((sum / ratings.length).toFixed(1));
      } else {
        averageRatings[criterion] = null;
      }
    });

    return {
      ...employee,
      totalAssignments: stats.total,
      completedAssignments: stats.completed,
      averageRatings,
    };
  });
  
  return results;
};

const useEmployees = (filters: Filters = {}) => {
  return useQuery<EmployeeWithStats[], Error>({
    queryKey: ['employeesWithStats', filters],
    queryFn: () => fetchEmployeesAndAssignments(filters),
    refetchInterval: 15000,
  });
};

export default useEmployees;