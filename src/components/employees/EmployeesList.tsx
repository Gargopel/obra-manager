import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, User, Briefcase, Star, Zap, CheckCircle, TrendingUp, Filter, SortAsc, SortDesc, Trash2 } from 'lucide-react';
import useEmployees, { EmployeeWithStats } from '@/hooks/use-employees';
import useConfigData from '@/hooks/use-config-data';
import { RATING_CRITERIA } from '@/utils/construction-structure';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useSession } from '@/contexts/SessionContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';

interface EmployeesListProps {
  filters: {
    service_type_id?: string;
    name_search?: string;
  };
  onViewDetails: (employee: EmployeeWithStats) => void;
}

type SortCriterion = typeof RATING_CRITERIA[number] | 'totalScore' | 'name';
type SortDirection = 'asc' | 'desc';

const RATING_LABELS: Record<SortCriterion, string> = {
  speed: 'Velocidade',
  quality: 'Qualidade',
  cleanliness: 'Limpeza',
  organization: 'Organização',
  totalScore: 'Média Geral',
  name: 'Nome',
};

const RATING_ICONS: Record<typeof RATING_CRITERIA[number], React.FC<any>> = {
  speed: Zap,
  quality: Star,
  cleanliness: CheckCircle,
  organization: TrendingUp,
};

const EmployeeCard: React.FC<{ employee: EmployeeWithStats, onViewDetails: (employee: EmployeeWithStats) => void }> = ({ employee, onViewDetails }) => {
  const { isAdmin } = useSession();
  const queryClient = useQueryClient();
  
  const totalScore = employee.averageRatings.speed !== null 
    ? parseFloat(((employee.averageRatings.speed + employee.averageRatings.quality + employee.averageRatings.cleanliness + employee.averageRatings.organization) / 4).toFixed(1))
    : null;
    
  const completionPercentage = employee.totalAssignments > 0 
    ? Math.round((employee.completedAssignments / employee.totalAssignments) * 100)
    : 0;
    
  const deleteEmployeeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess(`Funcionário ${employee.name} excluído com sucesso.`);
      queryClient.invalidateQueries({ queryKey: ['employeesWithStats'] });
    },
    onError: (error) => {
      showError('Erro ao excluir funcionário.');
    },
  });
  
  const handleDelete = () => {
    if (window.confirm(`Tem certeza que deseja excluir o funcionário ${employee.name}?`)) {
      deleteEmployeeMutation.mutate(employee.id);
    }
  };

  return (
    <Card className="backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 shadow-xl border border-white/30 dark:border-gray-700/50 transition-all duration-300 hover:shadow-2xl">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl flex items-center">
            <User className="w-5 h-5 mr-2 text-primary" />
            {employee.name}
          </CardTitle>
          <Badge variant={employee.type === 'ACPO' ? 'default' : 'secondary'}>
            {employee.type}
          </Badge>
        </div>
        <CardDescription className="text-sm mt-1">
          {employee.type === 'Terceirizado' ? `Empresa: ${employee.company_name || 'N/A'}` : 'Funcionário Interno'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        <div className="space-y-1 text-sm">
          <p className="font-medium">Atribuições: {employee.completedAssignments} / {employee.totalAssignments}</p>
          <Progress value={completionPercentage} className="h-2" />
          <p className="text-xs text-muted-foreground">{completionPercentage}% Concluído</p>
        </div>
        
        <div className="grid grid-cols-2 gap-3 border-t pt-3 border-border/50">
          <div className="col-span-2 text-sm font-semibold flex items-center">
            <Star className="w-4 h-4 mr-1 text-yellow-500" />
            Média Geral: {totalScore !== null ? totalScore : 'N/A'}
          </div>
          
          {RATING_CRITERIA.map(criterion => {
            const Icon = RATING_ICONS[criterion];
            const rating = employee.averageRatings[criterion];
            return (
              <div key={criterion} className="flex items-center text-sm">
                <Icon className="w-4 h-4 mr-2 text-muted-foreground" />
                <span className="font-medium mr-1">{RATING_LABELS[criterion]}:</span>
                <Badge variant="outline" className={cn(rating === null ? 'text-muted-foreground' : rating >= 4 ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' : '')}>
                  {rating !== null ? rating : 'N/A'}
                </Badge>
              </div>
            );
          })}
        </div>
        
        <div className="flex space-x-2 pt-2">
          <Button onClick={() => onViewDetails(employee)} className="flex-1" variant="outline">
            <Briefcase className="w-4 h-4 mr-2" />
            Atribuições
          </Button>
          
          {isAdmin && (
            <Button onClick={handleDelete} disabled={deleteEmployeeMutation.isPending} variant="destructive" size="icon">
              {deleteEmployeeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const EmployeesList: React.FC<EmployeesListProps> = ({ filters, onViewDetails }) => {
  const { data: employees, isLoading, error } = useEmployees(filters);
  const { data: configData, isLoading: isLoadingConfig } = useConfigData();
  
  const [sortBy, setSortBy] = useState<SortCriterion>('totalScore');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const sortedEmployees = useMemo(() => {
    if (!employees) return [];
    const employeesWithTotalScore = employees.map(emp => {
      const ratings = RATING_CRITERIA.map(c => emp.averageRatings[c]).filter(r => r !== null) as number[];
      const totalScore = ratings.length > 0 ? parseFloat((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)) : null;
      return { ...emp, totalScore };
    });
    return employeesWithTotalScore.sort((a, b) => {
      if (sortBy === 'name') {
        const comparison = a.name.localeCompare(b.name);
        return sortDirection === 'asc' ? comparison : -comparison;
      }
      const aValue = sortBy === 'totalScore' ? a.totalScore : a.averageRatings[sortBy];
      const bValue = sortBy === 'totalScore' ? b.totalScore : b.averageRatings[sortBy];
      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return 1;
      if (bValue === null) return -1;
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });
  }, [employees, sortBy, sortDirection]);
  
  if (isLoading || isLoadingConfig) return <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center text-sm text-muted-foreground">
        <Badge variant="outline" className="mr-2">{employees?.length || 0}</Badge>
        funcionários encontrados
      </div>
      
      <Card className="backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 shadow-xl border border-white/30 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="text-sm font-medium">Ordenar por:</div>
          <Select value={sortBy} onValueChange={(val) => setSortBy(val as SortCriterion)}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(RATING_LABELS).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}>
            {sortDirection === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
          </Button>
        </div>
      </Card>
      
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sortedEmployees.map(employee => <EmployeeCard key={employee.id} employee={employee} onViewDetails={onViewDetails} />)}
      </div>
    </div>
  );
};

export default EmployeesList;