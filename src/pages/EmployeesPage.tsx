import React, { useState } from 'react';
import { Users, Filter, PlusCircle, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useSiteConfig from '@/hooks/use-site-config';
import EmployeesFilterPanel from '@/components/employees/EmployeesFilterPanel';
import EmployeesList from '@/components/employees/EmployeesList';
import CreateEmployeeDialog from '@/components/employees/CreateEmployeeDialog';
import CreateAssignmentDialog from '@/components/employees/CreateAssignmentDialog';
import EmployeeDetailDialog from '@/components/employees/EmployeeDetailDialog'; // Importando o novo diálogo
import { EmployeeWithStats } from '@/hooks/use-employees';

const EmployeesPage: React.FC = () => {
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [isCreateEmployeeOpen, setIsCreateEmployeeOpen] = useState(false);
  const [isCreateAssignmentOpen, setIsCreateAssignmentOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false); // Novo estado para detalhes
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeWithStats | null>(null); // Novo estado para funcionário selecionado
  const [filters, setFilters] = useState({});
  const { data: siteConfig } = useSiteConfig();
  
  React.useEffect(() => {
    if (siteConfig?.site_name) {
      document.title = siteConfig.site_name + ' - Funcionários';
    }
  }, [siteConfig]);
  
  const handleViewDetails = (employee: EmployeeWithStats) => {
    setSelectedEmployee(employee);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground/90 backdrop-blur-sm p-2 rounded-lg max-w-full">
          <Users className="inline-block w-8 h-8 mr-2 text-primary" />
          Gerenciamento de Funcionários
        </h1>
        <div className="flex space-x-4 flex-shrink-0">
          <Button 
            variant="secondary" 
            onClick={() => setIsCreateAssignmentOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Briefcase className="w-4 h-4 mr-2" />
            Nova Atribuição
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 border border-white/30 dark:border-gray-700/50"
          >
            <Filter className="w-4 h-4 mr-2" />
            {isFilterOpen ? 'Ocultar Filtros' : 'Mostrar Filtros'}
          </Button>
          <Button onClick={() => setIsCreateEmployeeOpen(true)}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Novo Funcionário
          </Button>
        </div>
      </div>

      {isFilterOpen && (
        <EmployeesFilterPanel onApplyFilters={setFilters} />
      )}

      <EmployeesList filters={filters} onViewDetails={handleViewDetails} />

      <CreateEmployeeDialog open={isCreateEmployeeOpen} onOpenChange={setIsCreateEmployeeOpen} />
      <CreateAssignmentDialog open={isCreateAssignmentOpen} onOpenChange={setIsCreateAssignmentOpen} />
      
      {/* Diálogo de Detalhes do Funcionário */}
      <EmployeeDetailDialog 
        open={isDetailOpen} 
        onOpenChange={setIsDetailOpen} 
        employee={selectedEmployee}
      />
    </div>
  );
};

export default EmployeesPage;