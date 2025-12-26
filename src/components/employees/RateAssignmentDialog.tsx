import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Loader2, Star, Zap, CheckCircle, TrendingUp } from 'lucide-react';
import { RATING_CRITERIA } from '@/utils/construction-structure';
import { Assignment } from '@/hooks/use-employees';
import { useSession } from '@/contexts/SessionContext';

interface RateAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment: Assignment | null;
}

const RATING_LABELS: Record<typeof RATING_CRITERIA[number], string> = {
  speed: 'Velocidade',
  quality: 'Qualidade',
  cleanliness: 'Limpeza',
  organization: 'Organização',
};

const RATING_ICONS: Record<typeof RATING_CRITERIA[number], React.FC<any>> = {
  speed: Zap,
  quality: Star,
  cleanliness: CheckCircle,
  organization: TrendingUp,
};

const RatingInput: React.FC<{ label: string, icon: React.FC<any>, value: number, onChange: (value: number) => void }> = ({ label, icon: Icon, value, onChange }) => (
  <div className="space-y-1">
    <Label className="flex items-center text-sm font-medium">
      <Icon className="w-4 h-4 mr-2" />
      {label} ({value})
    </Label>
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-6 h-6 cursor-pointer transition-colors ${
            star <= value ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300 dark:text-gray-600'
          }`}
          onClick={() => onChange(star)}
        />
      ))}
    </div>
  </div>
);

const RateAssignmentDialog: React.FC<RateAssignmentDialogProps> = ({ open, onOpenChange, assignment }) => {
  const { user } = useSession();
  const queryClient = useQueryClient();
  
  const [ratings, setRatings] = useState({
    speed: 5,
    quality: 5,
    cleanliness: 5,
    organization: 5,
  });
  
  useEffect(() => {
    if (assignment) {
      // Pre-fill with existing ratings or default to 5
      setRatings({
        speed: assignment.rating_speed || 5,
        quality: assignment.rating_quality || 5,
        cleanliness: assignment.rating_cleanliness || 5,
        organization: assignment.rating_organization || 5,
      });
    }
  }, [assignment]);

  const updateAssignmentMutation = useMutation({
    mutationFn: async () => {
      if (!assignment || !user) throw new Error('Atribuição ou usuário ausente.');
      
      const payload = {
        status: 'Finalizado',
        finished_at: new Date().toISOString(),
        rated_by_user_id: user.id,
        rating_speed: ratings.speed,
        rating_quality: ratings.quality,
        rating_cleanliness: ratings.cleanliness,
        rating_organization: ratings.organization,
      };
      
      const { error: updateError } = await supabase
        .from('assignments')
        .update(payload)
        .eq('id', assignment.id);
        
      if (updateError) throw new Error('Erro ao finalizar e avaliar: ' + updateError.message);
    },
    onSuccess: () => {
      showSuccess('Atribuição finalizada e avaliada com sucesso!');
      onOpenChange(false);
      // Invalida as queries para atualizar as estatísticas do funcionário
      queryClient.invalidateQueries({ queryKey: ['employeesWithStats'] });
      queryClient.invalidateQueries({ queryKey: ['employeeAssignments', assignment?.employee_id] });
    },
    onError: (error) => {
      showError(error.message);
    },
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateAssignmentMutation.mutate();
  };
  
  if (!assignment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-lg backdrop-blur-md bg-white/70 dark:bg-gray-800/70 shadow-2xl border border-white/30 dark:border-gray-700/50">
        <DialogHeader>
          <DialogTitle>Avaliar e Finalizar Atribuição</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-6 py-4">
          
          <div className="text-sm text-muted-foreground border-b pb-3">
            <p>Serviço: <span className="font-semibold text-foreground">{assignment.service_type_name}</span></p>
            <p>Local: <span className="font-semibold text-foreground">{assignment.block_id} - {assignment.location_type}</span></p>
            <p className="mt-2 text-red-500 font-medium">Atenção: Esta ação marcará a tarefa como 'Finalizada'.</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {RATING_CRITERIA.map(criterion => (
              <RatingInput
                key={criterion}
                label={RATING_LABELS[criterion]}
                icon={RATING_ICONS[criterion]}
                value={ratings[criterion]}
                onChange={(value) => setRatings(prev => ({ ...prev, [criterion]: value }))}
              />
            ))}
          </div>
          
          <DialogFooter>
            <Button 
              type="submit" 
              disabled={updateAssignmentMutation.isPending}
            >
              {updateAssignmentMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : 'Finalizar e Avaliar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RateAssignmentDialog;