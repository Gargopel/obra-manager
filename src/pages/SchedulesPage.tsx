import React, { useState } from 'react';
import { CheckSquare, Plus, Loader2, Calendar, Target, User, Trash2, LayoutDashboard, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSchedules } from '@/hooks/use-schedules';
import { useSession } from '@/contexts/SessionContext';
import useSiteConfig from '@/hooks/use-site-config';
import CreateScheduleDialog from '@/components/schedules/CreateScheduleDialog';
import ScheduleDashboard from '@/components/schedules/ScheduleDashboard';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';

const SchedulesPage: React.FC = () => {
  const { user, isAdmin, profile } = useSession();
  const { data: siteConfig } = useSiteConfig();
  const { data: schedules, isLoading, refetch } = useSchedules(user?.id, isAdmin);
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);

  React.useEffect(() => {
    if (siteConfig?.site_name) document.title = siteConfig.site_name + ' - Cronogramas';
  }, [siteConfig]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Excluir este cronograma permanentemente?')) {
      const { error } = await supabase.from('schedules').delete().eq('id', id);
      if (error) showError('Erro ao excluir');
      else {
        showSuccess('Excluído');
        refetch();
      }
    }
  };

  if (selectedScheduleId) {
    return (
      <div className="space-y-6">
        <ScheduleDashboard 
          scheduleId={selectedScheduleId} 
          onBack={() => setSelectedScheduleId(null)} 
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-3xl font-black text-foreground/90 backdrop-blur-sm p-2 rounded-lg uppercase tracking-tighter">
          <CheckSquare className="inline-block w-8 h-8 mr-2 text-primary" />
          Meus Cronogramas e Metas
        </h1>
        <Button onClick={() => setIsCreateOpen(true)} className="shadow-lg shadow-primary/20 h-12 px-6 font-bold">
          <Plus className="w-5 h-5 mr-2" /> Novo Cronograma
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
        ) : schedules?.map(schedule => (
          <Card 
            key={schedule.id} 
            className="group cursor-pointer hover:shadow-2xl transition-all duration-300 border-white/20 bg-white/70 dark:bg-gray-900/70 overflow-hidden relative"
            onClick={() => setSelectedScheduleId(schedule.id)}
          >
            <div className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
               <Button variant="ghost" size="icon" onClick={(e) => handleDelete(e, schedule.id)} className="text-destructive hover:bg-red-50 dark:hover:bg-red-950">
                  <Trash2 className="w-4 h-4" />
               </Button>
            </div>
            
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start mb-2">
                <Badge variant="outline" className="bg-primary/5 text-[10px] font-bold uppercase">
                  {schedule.status}
                </Badge>
                <div className="text-[10px] text-muted-foreground flex items-center font-bold">
                  <Calendar className="w-3 h-3 mr-1" /> {format(new Date(schedule.deadline), 'dd/MM/yy')}
                </div>
              </div>
              <CardTitle className="text-xl font-black leading-tight uppercase group-hover:text-primary transition-colors">
                {schedule.title}
              </CardTitle>
              {isAdmin && (
                <div className="flex items-center text-xs text-muted-foreground mt-2">
                  <User className="w-3 h-3 mr-1" /> Resp: {schedule.user_name}
                </div>
              )}
            </CardHeader>
            <CardFooter className="pt-0 flex justify-between items-center text-xs font-bold text-muted-foreground border-t bg-accent/5 p-4">
               <div className="flex items-center gap-1">
                  <LayoutDashboard className="w-3 h-3" /> Dashboard de Metas
               </div>
               <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </CardFooter>
          </Card>
        ))}

        {schedules?.length === 0 && (
          <div className="col-span-full text-center py-20 bg-accent/5 border-2 border-dashed rounded-3xl">
             <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-20" />
             <h3 className="text-xl font-bold">Nenhum cronograma ativo</h3>
             <p className="text-muted-foreground">Crie uma meta personalizada para começar a acompanhar seu progresso.</p>
          </div>
        )}
      </div>

      <CreateScheduleDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </div>
  );
};

export default SchedulesPage;