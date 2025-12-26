import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Briefcase, MapPin, Wrench, Calendar, Clock, Star } from 'lucide-react';
import useEmployeeAssignments from '@/hooks/use-employee-assignments';
import { EmployeeWithStats, Assignment } from '@/hooks/use-employees';
import { format } from 'date-fns';
import RateAssignmentDialog from './RateAssignmentDialog';
import { RATING_CRITERIA } from '@/utils/construction-structure';

interface EmployeeDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: EmployeeWithStats | null;
}

const RATING_LABELS: Record<typeof RATING_CRITERIA[number], string> = {
  speed: 'Velocidade',
  quality: 'Qualidade',
  cleanliness: 'Limpeza',
  organization: 'Organização',
};

const AssignmentCard: React.FC<{ assignment: Assignment, onRate: (assignment: Assignment) => void }> = ({ assignment, onRate }) => {
  const isPending = assignment.status === 'Em Andamento';
  
  const locationText = assignment.apartment_number 
    ? `Apto ${assignment.apartment_number}`
    : assignment.floor_number
      ? `${assignment.floor_number}º Andar`
      : assignment.location_type;

  return (
    <Card className="border-l-4 border-blue-500 dark:border-blue-700 bg-background/80 shadow-md">
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg flex items-center">
            <Wrench className="w-4 h-4 mr-2 text-secondary-foreground" />
            {assignment.service_type_name}
          </CardTitle>
          <Badge variant={isPending ? 'default' : 'secondary'} className={isPending ? 'bg-blue-500 hover:bg-blue-600' : 'bg-green-500 hover:bg-green-600'}>
            {assignment.status}
          </Badge>
        </div>
        <CardDescription className="flex items-center text-sm mt-1">
          <MapPin className="w-4 h-4 mr-1" />
          Local: Bloco {assignment.block_id} - {locationText} ({assignment.location_type})
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-2 space-y-2">
        <div className="text-xs text-muted-foreground flex items-center">
          <Calendar className="w-3 h-3 mr-1" />
          Início: {format(new Date(assignment.created_at), 'dd/MM/yyyy HH:mm')}
        </div>
        
        {isPending ? (
          <Button 
            onClick={() => onRate(assignment)} 
            className="w-full mt-3 bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Finalizar e Avaliar
          </Button>
        ) : (
          <div className="mt-3 p-3 border rounded-md bg-accent/50 space-y-1">
            <p className="text-sm font-semibold flex items-center text-green-600 dark:text-green-400">
              <CheckCircle className="w-4 h-4 mr-2" />
              Finalizado em: {assignment.finished_at ? format(new Date(assignment.finished_at), 'dd/MM/yyyy') : 'N/A'}
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {RATING_CRITERIA.map(criterion => (
                <div key={criterion} className="flex items-center">
                  <Star className="w-3 h-3 mr-1 text-yellow-500 fill-yellow-500" />
                  {RATING_LABELS[criterion]}: {assignment[`rating_${criterion}`] || 'N/A'}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const EmployeeDetailDialog: React.FC<EmployeeDetailDialogProps> = ({ open, onOpenChange, employee }) => {
  const { data: assignments, isLoading, error } = useEmployeeAssignments(employee?.id);
  const [isRateDialogOpen, setIsRateDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  const openAssignments = assignments?.filter(a => a.status === 'Em Andamento') || [];
  const closedAssignments = assignments?.filter(a => a.status === 'Finalizado') || [];
  
  const handleRateAssignment = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setIsRateDialogOpen(true);
  };
  
  if (!employee) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto backdrop-blur-md bg-white/70 dark:bg-gray-800/70 shadow-2xl border border-white/30 dark:border-gray-700/50">
          <DialogHeader>
            <DialogTitle className="flex items-center text-2xl">
              <Briefcase className="w-6 h-6 mr-2 text-primary" />
              Atribuições de {employee.name}
            </DialogTitle>
            <CardDescription className="text-sm">
              {employee.type} - {employee.company_name || 'ACPO'}
            </CardDescription>
          </DialogHeader>
          
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : error ? (
            <div className="text-red-500 py-4">Erro ao carregar atribuições: {error.message}</div>
          ) : (
            <div className="space-y-6">
              
              {/* Atribuições Abertas */}
              <section className="space-y-3">
                <h3 className="text-xl font-semibold flex items-center text-blue-600 dark:text-blue-400">
                  <Clock className="w-5 h-5 mr-2" />
                  Em Andamento ({openAssignments.length})
                </h3>
                {openAssignments.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {openAssignments.map(assignment => (
                      <AssignmentCard 
                        key={assignment.id} 
                        assignment={assignment} 
                        onRate={handleRateAssignment} 
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Nenhuma atribuição aberta.</p>
                )}
              </section>
              
              {/* Atribuições Finalizadas */}
              <section className="space-y-3">
                <h3 className="text-xl font-semibold flex items-center text-green-600 dark:text-green-400">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Finalizadas ({closedAssignments.length})
                </h3>
                {closedAssignments.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {closedAssignments.map(assignment => (
                      <AssignmentCard 
                        key={assignment.id} 
                        assignment={assignment} 
                        onRate={handleRateAssignment} 
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Nenhuma atribuição finalizada.</p>
                )}
              </section>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Diálogo de Avaliação */}
      <RateAssignmentDialog 
        open={isRateDialogOpen} 
        onOpenChange={setIsRateDialogOpen} 
        assignment={selectedAssignment}
      />
    </>
  );
};

export default EmployeeDetailDialog;