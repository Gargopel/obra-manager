import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ListChecks, CheckCircle, Clock, Loader2, TrendingUp } from 'lucide-react';
import useDashboardData from '@/hooks/use-dashboard-data';
import { Progress } from '@/components/ui/progress';

const DashboardStats: React.FC = () => {
  const { data, isLoading, error } = useDashboardData();

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="h-32 flex items-center justify-center backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 shadow-xl border border-white/30 dark:border-gray-700/50">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">Erro ao carregar dados: {error.message}</div>;
  }

  if (!data) return null;

  const stats = [
    {
      title: 'Total de Demandas',
      value: data.totalDemands,
      icon: ListChecks,
      description: 'Registros totais na obra.',
    },
    {
      title: 'Demandas Pendentes',
      value: data.pendingDemands,
      icon: Clock,
      description: 'Aguardando resolução.',
      color: 'text-yellow-600 dark:text-yellow-400',
    },
    {
      title: 'Demandas Resolvidas',
      value: data.resolvedDemands,
      icon: CheckCircle,
      description: 'Total de problemas solucionados.',
      color: 'text-green-600 dark:text-green-400',
    },
    {
      title: 'Tempo Médio de Resposta',
      value: data.resolutionTimeAvg,
      icon: TrendingUp,
      description: 'Média do tempo de resolução.',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index} className="backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 shadow-xl border border-white/30 dark:border-gray-700/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 text-muted-foreground ${stat.color || ''}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Andamento Geral da Obra */}
      <Card className="backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 shadow-xl border border-white/30 dark:border-gray-700/50">
        <CardHeader>
          <CardTitle>Andamento Geral da Obra</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Progress value={data.completionPercentage} className="h-3" />
            <span className="text-lg font-semibold">{data.completionPercentage}%</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardStats;