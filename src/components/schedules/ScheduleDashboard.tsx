import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useScheduleDetails } from '@/hooks/use-schedules';
import { Loader2, Calendar, Clock, CheckCircle2, AlertTriangle, FileText, ArrowLeft, Target, TrendingUp, RotateCcw } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { exportToPdf } from '@/utils/pdf-export';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { showSuccess, showError } from '@/utils/toast';

interface ScheduleDashboardProps {
  scheduleId: string;
  onBack: () => void;
}

const ScheduleDashboard: React.FC<ScheduleDashboardProps> = ({ scheduleId, onBack }) => {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useScheduleDetails(scheduleId);

  // Mutation para atualizar o status da demanda diretamente aqui
  const updateDemandMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: 'Pendente' | 'Resolvido' }) => {
      const { error } = await supabase
        .from('demands')
        .update({ 
          status,
          resolved_at: status === 'Resolvido' ? new Date().toISOString() : null
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule', scheduleId] });
      queryClient.invalidateQueries({ queryKey: ['demands'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
      showSuccess('Status atualizado com sucesso!');
    },
    onError: (err: any) => showError('Erro ao atualizar: ' + err.message)
  });

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  if (error || !data) return <div className="text-red-500">Erro ao carregar dashboard.</div>;

  const { schedule, demands, stats } = data;

  const handleExportPdf = () => {
    const columns = ['Item', 'Status', 'Criado em', 'Duração'];
    const rows = demands.map(d => [
      `${d.block_id} - ${d.apartment_number} (${d.service_type_name})`,
      d.status,
      format(new Date(d.created_at), 'dd/MM/yy'),
      d.resolved_at ? 'Concluído' : 'Pendente'
    ]);

    exportToPdf({
      title: `Cronograma: ${schedule.title}`,
      filename: `cronograma_${scheduleId}`,
      columns,
      rows,
      siteName: `Responsável: ${schedule.user_name}`
    });
  };

  const chartData = [
    { name: 'Resolvidos', value: stats.resolvedDemands, color: '#22c55e' },
    { name: 'Pendentes', value: stats.pendingDemands, color: '#eab308' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <Button variant="ghost" onClick={onBack} className="text-muted-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para lista
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportPdf}>
            <FileText className="w-4 h-4 mr-2" /> Gerar PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card Principal de Resumo */}
        <Card className="lg:col-span-2 backdrop-blur-md bg-white/70 dark:bg-gray-800/70 border-white/20 shadow-2xl relative overflow-hidden">
          <div className={`absolute top-0 right-0 p-4 font-black opacity-10 text-6xl pointer-events-none ${stats.statusColor}`}>
             {stats.progressPercentage}%
          </div>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-3xl font-black uppercase tracking-tighter">{schedule.title}</CardTitle>
                <CardDescription className="text-lg flex items-center gap-2 mt-1">
                  <Target className="w-4 h-4 text-primary" /> 
                  Objetivo: Finalizar {stats.totalDemands} demandas vinculadas
                </CardDescription>
              </div>
              <Badge className={`text-sm px-4 py-1 ${stats.statusColor} bg-opacity-20`}>
                {stats.statusText}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-bold">
                <span>PROGRESSO GERAL</span>
                <span>{stats.progressPercentage}%</span>
              </div>
              <Progress value={stats.progressPercentage} className="h-4 shadow-inner" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="p-4 rounded-2xl bg-background/50 border">
                <Calendar className="w-5 h-5 mb-2 text-blue-500" />
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Prazo Final</p>
                <p className="text-sm font-black">{format(new Date(schedule.deadline), 'dd/MM/yyyy')}</p>
              </div>
              <div className="p-4 rounded-2xl bg-background/50 border">
                <Clock className={`w-5 h-5 mb-2 ${stats.isExpired ? 'text-red-500' : 'text-orange-500'}`} />
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Dias Restantes</p>
                <p className="text-sm font-black">{stats.daysRemaining} dias</p>
              </div>
              <div className="p-4 rounded-2xl bg-background/50 border">
                <TrendingUp className="w-5 h-5 mb-2 text-green-500" />
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Tempo Médio</p>
                <p className="text-sm font-black">{stats.avgResolutionTime} / demanda</p>
              </div>
              <div className="p-4 rounded-2xl bg-background/50 border">
                <CheckCircle2 className="w-5 h-5 mb-2 text-primary" />
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Concluídas</p>
                <p className="text-sm font-black">{stats.resolvedDemands} de {stats.totalDemands}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Rosca */}
        <Card className="backdrop-blur-md bg-white/70 dark:bg-gray-800/70 border-white/20">
          <CardHeader><CardTitle className="text-sm uppercase font-bold text-muted-foreground">Distribuição de Status</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 text-xs font-bold mt-4">
              <div className="flex items-center gap-1 text-green-600"><div className="w-3 h-3 bg-green-500 rounded-full" /> Resolvidas</div>
              <div className="flex items-center gap-1 text-yellow-600"><div className="w-3 h-3 bg-yellow-500 rounded-full" /> Pendentes</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas e Insights */}
      {stats.isExpired && stats.progressPercentage < 100 && (
        <div className="p-6 bg-red-100 border-l-8 border-red-500 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl flex items-center gap-4 animate-bounce">
          <AlertTriangle className="w-8 h-8" />
          <div>
            <h4 className="font-black text-lg">ALERTA DE ATRASO!</h4>
            <p className="text-sm opacity-80">Este cronograma já ultrapassou o prazo de entrega em {Math.abs(stats.daysRemaining)} dias.</p>
          </div>
        </div>
      )}

      {/* Lista de Demandas Vinculadas */}
      <Card className="backdrop-blur-md bg-white/70 dark:bg-gray-800/70 border-white/20">
        <CardHeader>
          <CardTitle>Listagem de Tarefas do Escopo</CardTitle>
          <CardDescription>Todas as demandas identificadas que compõem este cronograma. Mude o status clicando nos botões.</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {demands.map(demand => {
                const isItemPending = demand.status === 'Pendente';
                return (
                  <div key={demand.id} className="p-4 border rounded-xl bg-background/50 flex justify-between items-center group hover:border-primary transition-all shadow-sm">
                    <div className="flex-1 mr-4">
                      <p className="text-sm font-black uppercase">{demand.block_id} - {demand.apartment_number}</p>
                      <p className="text-xs text-muted-foreground font-medium">{demand.service_type_name}</p>
                      <p className="text-[10px] text-muted-foreground italic truncate max-w-[150px]">{demand.description || 'Sem descrição'}</p>
                    </div>
                    
                    <div className="flex shrink-0">
                      {isItemPending ? (
                        <Button 
                          size="sm" 
                          onClick={() => updateDemandMutation.mutate({ id: demand.id, status: 'Resolvido' })}
                          className="bg-green-600 hover:bg-green-700 text-white h-8 text-[10px] font-bold uppercase"
                          disabled={updateDemandMutation.isPending}
                        >
                          Resolver
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => updateDemandMutation.mutate({ id: demand.id, status: 'Pendente' })}
                          className="border-yellow-500 text-yellow-600 hover:bg-yellow-50 h-8 text-[10px] font-bold uppercase"
                          disabled={updateDemandMutation.isPending}
                        >
                          <RotateCcw className="w-3 h-3 mr-1" /> Reabrir
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
              {demands.length === 0 && <p className="col-span-full text-center py-10 text-muted-foreground italic">Nenhuma demanda encontrada para este escopo selecionado.</p>}
           </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScheduleDashboard;