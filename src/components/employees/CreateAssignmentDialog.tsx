import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { BLOCKS, APARTMENT_NUMBERS, ASSIGNMENT_LOCATION_TYPES } from '@/utils/construction-structure';
import useConfigData from '@/hooks/use-config-data';
import useEmployees, { Employee } from '@/hooks/use-employees';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Loader2 } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';

interface CreateAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateAssignmentDialog: React.FC<CreateAssignmentDialogProps> = ({ open, onOpenChange }) => {
  const { data: configData, isLoading: isLoadingConfig } = useConfigData();
  const { data: employees, isLoading: isLoadingEmployees } = useEmployees({});
  const { user } = useSession();
  const queryClient = useQueryClient();
  
  const [employeeId, setEmployeeId] = useState('');
  const [serviceTypeId, setServiceTypeId] = useState('');
  const [locationType, setLocationType] = useState<string>(ASSIGNMENT_LOCATION_TYPES[0]);
  const [blockId, setBlockId] = useState('');
  const [apartmentNumber, setApartmentNumber] = useState<string | undefined>(undefined);
  const [floorNumber, setFloorNumber] = useState<number | undefined>(undefined);
  
  // Lógica de visibilidade dos campos de localização
  const showApartment = locationType === 'Apartamento Específico';
  const showFloor = locationType === 'Andar Específico' || locationType === 'Andar da Circulação';
  const showBlock = true; // Bloco é sempre obrigatório

  useEffect(() => {
    // Reset fields based on location type change
    if (!showApartment) setApartmentNumber(undefined);
    if (!showFloor) setFloorNumber(undefined);
  }, [locationType, showApartment, showFloor]);
  
  // Calcula o andar com base no número do apartamento
  const getFloorNumberFromApartment = (aptNumber: string): number | undefined => {
    if (aptNumber.length === 3 || aptNumber.length === 4) {
      return parseInt(aptNumber.charAt(0), 10);
    }
    return undefined;
  };

  const resetForm = () => {
    setEmployeeId('');
    setServiceTypeId('');
    setLocationType(ASSIGNMENT_LOCATION_TYPES[0]);
    setBlockId('');
    setApartmentNumber(undefined);
    setFloorNumber(undefined);
  };
  
  const createAssignmentMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Usuário não autenticado.');
      if (!employeeId || !serviceTypeId || !blockId) {
        throw new Error('Preencha todos os campos obrigatórios (Funcionário, Serviço, Bloco).');
      }
      
      let finalApartmentNumber = showApartment ? apartmentNumber : null;
      let finalFloorNumber = showFloor ? floorNumber : null;
      
      // Se for apartamento específico, o andar é derivado do apartamento
      if (finalApartmentNumber) {
        finalFloorNumber = getFloorNumberFromApartment(finalApartmentNumber) || null;
      }
      
      const payload = {
        user_id: user.id,
        employee_id: employeeId,
        service_type_id: serviceTypeId,
        location_type: locationType,
        block_id: blockId,
        apartment_number: finalApartmentNumber,
        floor_number: finalFloorNumber,
        status: 'Em Andamento',
      };
      
      const { error: insertError } = await supabase
        .from('assignments')
        .insert(payload);
        
      if (insertError) throw new Error('Erro ao registrar atribuição: ' + insertError.message);
    },
    onSuccess: () => {
      showSuccess('Atribuição de trabalho registrada com sucesso!');
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
    createAssignmentMutation.mutate();
  };
  
  const isFormValid = employeeId && serviceTypeId && blockId && 
                      (!showApartment || apartmentNumber) && 
                      (!showFloor || floorNumber !== undefined);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-lg backdrop-blur-md bg-white/70 dark:bg-gray-800/70 shadow-2xl border border-white/30 dark:border-gray-700/50">
        <DialogHeader>
          <DialogTitle>Registrar Nova Atribuição</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          
          {/* Funcionário */}
          <div className="space-y-2">
            <Label htmlFor="employee">Funcionário *</Label>
            <Select value={employeeId} onValueChange={setEmployeeId} disabled={isLoadingEmployees}>
              <SelectTrigger id="employee">
                <SelectValue placeholder="Selecione o Funcionário" />
              </SelectTrigger>
              <SelectContent>
                {employees?.map(emp => (
                  <SelectItem key={emp.id} value={emp.id}>{`${emp.name} (${emp.type})`}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Tipo de Serviço */}
          <div className="space-y-2">
            <Label htmlFor="serviceType">Tipo de Serviço *</Label>
            <Select value={serviceTypeId} onValueChange={setServiceTypeId} disabled={isLoadingConfig}>
              <SelectTrigger id="serviceType">
                <SelectValue placeholder="Selecione o Serviço" />
              </SelectTrigger>
              <SelectContent>
                {configData?.serviceTypes.map(service => (
                  <SelectItem key={service.id} value={service.id}>{service.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Localização */}
          <div className="space-y-2">
            <Label htmlFor="locationType">Tipo de Localização *</Label>
            <Select value={locationType} onValueChange={setLocationType}>
              <SelectTrigger id="locationType">
                <SelectValue placeholder="Selecione o Tipo de Localização" />
              </SelectTrigger>
              <SelectContent>
                {ASSIGNMENT_LOCATION_TYPES.map(loc => (
                  <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Bloco e Andar/Apartamento */}
          <div className="grid grid-cols-2 gap-4">
            {/* Bloco */}
            <div className="space-y-2">
              <Label htmlFor="block">Bloco *</Label>
              <Select value={blockId} onValueChange={setBlockId}>
                <SelectTrigger id="block">
                  <SelectValue placeholder="Selecione o Bloco" />
                </SelectTrigger>
                <SelectContent>
                  {BLOCKS.map(block => (
                    <SelectItem key={block} value={block}>{`Bloco ${block}`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Andar ou Apartamento */}
            {showApartment && (
              <div className="space-y-2">
                <Label htmlFor="apartment">Apartamento *</Label>
                <Select 
                  value={apartmentNumber || ''} 
                  onValueChange={setApartmentNumber}
                >
                  <SelectTrigger id="apartment">
                    <SelectValue placeholder="Selecione o Apto" />
                  </SelectTrigger>
                  <SelectContent>
                    {APARTMENT_NUMBERS.map(apt => (
                      <SelectItem key={apt} value={apt}>{`Apto ${apt}`}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {showFloor && (
              <div className="space-y-2">
                <Label htmlFor="floor">Andar *</Label>
                <Select 
                  value={floorNumber !== undefined ? floorNumber.toString() : ''} 
                  onValueChange={(val) => setFloorNumber(parseInt(val, 10))}
                >
                  <SelectTrigger id="floor">
                    <SelectValue placeholder="Selecione o Andar" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map(floor => (
                      <SelectItem key={floor} value={floor.toString()}>{`${floor}º Andar`}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              type="submit" 
              disabled={createAssignmentMutation.isPending || !isFormValid}
            >
              {createAssignmentMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : 'Registrar Atribuição'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAssignmentDialog;