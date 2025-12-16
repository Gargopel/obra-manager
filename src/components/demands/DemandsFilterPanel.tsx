import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { APARTMENT_NUMBERS, DEMAND_STATUSES } from '@/utils/construction-structure';
import useConfigData from '@/hooks/use-config-data';
import { Filter, X } from 'lucide-react';

interface Filters {
  block_id?: string;
  apartment_number?: string;
  service_type_id?: string;
  room_id?: string;
  status?: string;
}

interface DemandsFilterPanelProps {
  onApplyFilters: (filters: Filters) => void;
}

const DemandsFilterPanel: React.FC<DemandsFilterPanelProps> = ({ onApplyFilters }) => {
  const { data: configData, isLoading: isLoadingConfig } = useConfigData();
  const [currentFilters, setCurrentFilters] = useState<Filters>({});

  const handleFilterChange = (key: keyof Filters, value: string | undefined) => {
    setCurrentFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value,
    }));
  };

  const handleClearFilters = () => {
    setCurrentFilters({});
    onApplyFilters({});
  };

  useEffect(() => {
    // Apply filters immediately on change for a fast experience
    onApplyFilters(currentFilters);
  }, [currentFilters, onApplyFilters]);

  return (
    <Card className="backdrop-blur-md bg-white/70 dark:bg-gray-800/70 shadow-xl border border-white/30 dark:border-gray-700/50 transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between p-4 border-b border-border/50">
        <CardTitle className="text-lg flex items-center">
          <Filter className="w-5 h-5 mr-2" />
          Filtros Combinados
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={handleClearFilters}>
          <X className="w-4 h-4 mr-1" /> Limpar
        </Button>
      </CardHeader>
      <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        
        {/* Bloco */}
        <Select 
          value={currentFilters.block_id || 'all'} 
          onValueChange={(val) => handleFilterChange('block_id', val)}
          disabled={isLoadingConfig}
        >
          <SelectTrigger>
            <SelectValue placeholder="Bloco" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Blocos</SelectItem>
            {configData?.blocks.map(block => (
              <SelectItem key={block.id} value={block.name}>{`Bloco ${block.name}`}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Apartamento */}
        <Select 
          value={currentFilters.apartment_number || 'all'} 
          onValueChange={(val) => handleFilterChange('apartment_number', val)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Apartamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Apartamentos</SelectItem>
            {APARTMENT_NUMBERS.map(apt => (
              <SelectItem key={apt} value={apt}>{`Apto ${apt}`}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Tipo de Serviço */}
        <Select 
          value={currentFilters.service_type_id || 'all'} 
          onValueChange={(val) => handleFilterChange('service_type_id', val)}
          disabled={isLoadingConfig}
        >
          <SelectTrigger>
            <SelectValue placeholder="Tipo de Serviço" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Serviços</SelectItem>
            {configData?.serviceTypes.map(service => (
              <SelectItem key={service.id} value={service.id}>{service.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Cômodo */}
        <Select 
          value={currentFilters.room_id || 'all'} 
          onValueChange={(val) => handleFilterChange('room_id', val)}
          disabled={isLoadingConfig}
        >
          <SelectTrigger>
            <SelectValue placeholder="Cômodo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Cômodos</SelectItem>
            {configData?.rooms.map(room => (
              <SelectItem key={room.id} value={room.id}>{room.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status */}
        <Select 
          value={currentFilters.status || 'all'} 
          onValueChange={(val) => handleFilterChange('status', val)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            {DEMAND_STATUSES.map(status => (
              <SelectItem key={status} value={status}>{status}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
};

export default DemandsFilterPanel;