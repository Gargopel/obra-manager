import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import useConfigData from '@/hooks/use-config-data';
import { Filter, X, Search } from 'lucide-react';

interface Filters {
  service_type_id?: string;
  name_search?: string;
}

interface EmployeesFilterPanelProps {
  onApplyFilters: (filters: Filters) => void;
}

const EmployeesFilterPanel: React.FC<EmployeesFilterPanelProps> = ({ onApplyFilters }) => {
  const { data: configData, isLoading: isLoadingConfig } = useConfigData();
  const [currentFilters, setCurrentFilters] = useState<Filters>({});
  const [nameInput, setNameInput] = useState('');

  const handleFilterChange = (key: keyof Filters, value: string | undefined) => {
    setCurrentFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value,
    }));
  };

  const handleSearch = () => {
    handleFilterChange('name_search', nameInput.trim() || undefined);
  };

  const handleClearFilters = () => {
    setCurrentFilters({});
    setNameInput('');
    onApplyFilters({});
  };

  useEffect(() => {
    // Apply filters immediately on change (except for name search, which requires button click/enter)
    onApplyFilters(currentFilters);
  }, [currentFilters, onApplyFilters]);

  return (
    <Card className="backdrop-blur-md bg-white/70 dark:bg-gray-800/70 shadow-xl border border-white/30 dark:border-gray-700/50 transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between p-4 border-b border-border/50">
        <CardTitle className="text-lg flex items-center">
          <Filter className="w-5 h-5 mr-2" />
          Filtros de Funcionários
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={handleClearFilters}>
          <X className="w-4 h-4 mr-1" /> Limpar
        </Button>
      </CardHeader>
      <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Busca por Nome */}
        <div className="flex space-x-2">
          <Input
            placeholder="Buscar por nome..."
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
          />
          <Button onClick={handleSearch} size="icon">
            <Search className="w-4 h-4" />
          </Button>
        </div>

        {/* Tipo de Serviço */}
        <Select 
          value={currentFilters.service_type_id || 'all'} 
          onValueChange={(val) => handleFilterChange('service_type_id', val)}
          disabled={isLoadingConfig}
        >
          <SelectTrigger>
            <SelectValue placeholder="Filtrar por Serviço" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Serviços</SelectItem>
            {configData?.serviceTypes.map(service => (
              <SelectItem key={service.id} value={service.id}>{service.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
};

export default EmployeesFilterPanel;