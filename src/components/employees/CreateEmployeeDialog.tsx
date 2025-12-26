import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Loader2 } from 'lucide-react';

interface CreateEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateEmployeeDialog: React.FC<CreateEmployeeDialogProps> = ({ open, onOpenChange }) => {
  const queryClient = useQueryClient();
  
  const [name, setName] = useState('');
  const [type, setType] = useState<'ACPO' | 'Terceirizado'>('ACPO');
  const [companyName, setCompanyName] = useState('');
  
  const resetForm = () => {
    setName('');
    setType('ACPO');
    setCompanyName('');
  };
  
  const createEmployeeMutation = useMutation({
    mutationFn: async () => {
      if (!name.trim()) {
        throw new Error('O nome do funcionário é obrigatório.');
      }
      
      const payload = {
        name: name.trim(),
        type: type,
        company_name: type === 'Terceirizado' ? companyName.trim() || null : null,
      };
      
      const { error: insertError } = await supabase
        .from('employees')
        .insert(payload);
        
      if (insertError) throw new Error('Erro ao registrar funcionário: ' + insertError.message);
    },
    onSuccess: () => {
      showSuccess('Funcionário registrado com sucesso!');
      resetForm();
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ['employeesWithStats'] });
    },
    onError: (error) => {
      showError(error.message);
    },
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createEmployeeMutation.mutate();
  };
  
  const isFormValid = name.trim() && (type === 'ACPO' || companyName.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-lg backdrop-blur-md bg-white/70 dark:bg-gray-800/70 shadow-2xl border border-white/30 dark:border-gray-700/50">
        <DialogHeader>
          <DialogTitle>Registrar Novo Funcionário</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo *</Label>
            <Input 
              id="name"
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Nome do funcionário"
            />
          </div>
          
          {/* Tipo */}
          <div className="space-y-2">
            <Label htmlFor="type">Vínculo *</Label>
            <Select value={type} onValueChange={(val) => setType(val as 'ACPO' | 'Terceirizado')}>
              <SelectTrigger id="type">
                <SelectValue placeholder="Selecione o Vínculo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACPO">ACPO (Interno)</SelectItem>
                <SelectItem value="Terceirizado">Terceirizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Empresa (se Terceirizado) */}
          {type === 'Terceirizado' && (
            <div className="space-y-2">
              <Label htmlFor="companyName">Nome da Empresa Terceirizada *</Label>
              <Input 
                id="companyName"
                value={companyName} 
                onChange={(e) => setCompanyName(e.target.value)} 
                placeholder="Nome da empresa"
              />
            </div>
          )}
          
          <DialogFooter>
            <Button 
              type="submit" 
              disabled={createEmployeeMutation.isPending || !name.trim()}
            >
              {createEmployeeMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : 'Registrar Funcionário'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEmployeeDialog;