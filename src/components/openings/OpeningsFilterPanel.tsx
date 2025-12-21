import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { APARTMENT_NUMBERS } from '@/utils/construction-structure';
import useConfigData from '@/hooks/use-config-data';
import { Filter, X } from 'lucide-react';

interface Filters {
  block_id?: string;
  apartment_number?: string;
  floor_number?: number;
  opening_type_id?: string;
  status?: string;
}

interface OpeningsFilterPanelProps {
  onApplyFilters: (filters: Filters) => void;
}

const OpeningsFilterPanel: React.FC<OpeningsFilterPanelProps> = ({ onApplyFilters }) => {
  const { data: configData, isLoading: isLoadingConfig } = useConfigData();
  const [currentFilters, setCurrentFilters] = useState<Filters>({});

  const handleFilterChange = (key: keyof Filters, value: string | number | undefined) => {
    setCurrentFilters(prev => ({
      ...prev,
      [key]: value === 'all' || value === '' || value === undefined ? undefined : value,
    }));
  };

  const handleClearFilters = () => {
    setCurrentFilters({});
    onApplyFilters({});
  };

  useEffect(() => {
    onApplyFilters(currentFilters);
  }, [currentFilters, onApplyFilters]);

  return (
    <Card className="backdrop-blur-md bg-white/70 dark:bg-gray-800/70 shadow-xl border border-white/30 dark:border-gray-700/50 transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between p-4 border-b border-border/50">
        <CardTitle className="text-lg flex items-center">
          <Filter className="w-5 h-5 mr-2" />
          Filtros de Aberturas
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={handleClearFilters}>
          <X className="w-4 h-4 mr-1" /> Limpar
        </Button>
      </CardHeader>
      <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        
        {/* Bloco */}
        <Select 
          value={currentFilters.block_id || 'all'} 
          onValueChange={(val) => handleFilterChange('block_id', val === 'all' ? undefined : val)}
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
          onValueChange={(val) => handleFilterChange('apartment_number', val === 'all' ? undefined : val)}
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

        {/* Andar */}
        <Select 
          value={currentFilters.floor_number !== undefined ? currentFilters.floor_number.toString() : 'all'} 
          onValueChange={(val) => handleFilterChange('floor_number', val === 'all' ? undefined : parseInt(val, 10))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Andar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Andares</SelectItem>
            {[1, 2, 3, 4, 5].map(floor => (
              <SelectItem key={floor} value={floor.toString()}>{`${floor}º Andar`}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Tipo de Abertura */}
        <Select 
          value={currentFilters.opening_type_id || 'all'} 
          onValueChange={(val) => handleFilterChange('opening_type_id', val === 'all' ? undefined : val)}
          disabled={isLoadingConfig}
        >
          <SelectTrigger>
            <SelectValue placeholder="Tipo de Abertura" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tipos</SelectItem>
            {configData?.openingTypes.map(type => (
              <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status */}
        <Select 
          value={currentFilters.status || 'all'} 
          onValueChange={(val) => handleFilterChange('status', val === 'all' ? undefined : val)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="Em Andamento">Em Andamento</SelectItem>
            <SelectItem value="Finalizado">Finalizado</SelectItem>
            <SelectItem value="Entregue">Entregue</SelectItem>
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
};

export default OpeningsFilterPanel;