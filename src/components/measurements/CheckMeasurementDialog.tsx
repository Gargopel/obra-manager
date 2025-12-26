import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { MeasurementDetail } from '@/hooks/use-measurements';
import { useSession } from '@/contexts/SessionContext';

interface CheckMeasurementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  measurement: MeasurementDetail | null;
}

const CheckMeasurementDialog: React.FC<CheckMeasurementDialogProps> = ({ open, onOpenChange, measurement }) => {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [result, setResult] = useState<string>('');
  const [missingDetails, setMissingDetails] = useState('');

  useEffect(() => {
    if (measurement) {
      setResult(measurement.result || 'Concluída');
      setMissingDetails(measurement.missing_details || '');
    }
  }, [measurement]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!measurement || !user) throw new Error('Dados incompletos');
      const { error } = await supabase.from('measurements').update({
        status: 'Conferida',
        result,
        missing_details: result === 'Inconcluída' ? missingDetails.trim() : null,
        checked_by_id: user.id,
        updated_at: new Date().toISOString(),
      }).eq('id', measurement.id);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess('Medição conferida com sucesso!');
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ['measurements'] });
    },
    onError: (err: any) => showError(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Conferência de Serviço</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div className="p-3 bg-accent/30 rounded text-sm space-y-1">
            <p><strong>Local:</strong> {measurement?.block_id} - {measurement?.apartment_number || measurement?.floor_number + 'º Andar'}</p>
            <p><strong>Serviço:</strong> {measurement?.service_type_name}</p>
            {measurement?.notes && <p><strong>Nota:</strong> {measurement.notes}</p>}
          </div>

          <div className="space-y-2">
            <Label>Resultado da Conferência *</Label>
            <Select value={result} onValueChange={setResult}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Concluída">Concluída</SelectItem>
                <SelectItem value="Inconcluída">Inconcluída</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {result === 'Inconcluída' && (
            <div className="space-y-2">
              <Label>O que falta para concluir? *</Label>
              <Textarea 
                value={missingDetails} 
                onChange={(e) => setMissingDetails(e.target.value)} 
                placeholder="Ex: Falta rejuntar o canto da pia" 
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button 
            onClick={() => updateMutation.mutate()} 
            disabled={!result || (result === 'Inconcluída' && !missingDetails.trim()) || updateMutation.isPending}
          >
            {updateMutation.isPending ? <Loader2 className="animate-spin h-4 w-4" /> : 'Salvar Conferência'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CheckMeasurementDialog;