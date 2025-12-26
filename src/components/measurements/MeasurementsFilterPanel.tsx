import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Filter, X } from 'lucide-react';
import useConfigData from '@/hooks/use-config-data';

interface Filters {
  block_id?: string;
  status?: string;
  result?: string;
  service_type_id?: string;
}

interface MeasurementsFilterPanelProps {
  onApplyFilters: (filters: Filters) => void;
}

const MeasurementsFilterPanel: React.FC<MeasurementsFilterPanelProps> = ({ onApplyFilters }) => {
  const { data: configData } = useConfigData();
  const [currentFilters, setCurrentFilters] = useState<Filters>({});

  const handleFilterChange = (key: keyof Filters, value: string | undefined) => {
    setCurrentFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value,
    }));
  };

  useEffect(() => {
    onApplyFilters(currentFilters);
  }, [currentFilters, onApplyFilters]);

  return (
    <Card className="backdrop-blur-md bg-white/70 dark:bg-gray-800/70 shadow-xl border border-white/30 dark:border-gray-700/50">
      <CardHeader className="flex flex-row items-center justify-between p-4 border-b border-border/50">
        <CardTitle className="text-lg flex items-center">
          <Filter className="w-5 h-5 mr-2" />
          Filtros de Medição
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={() => setCurrentFilters({})}>
          <X className="w-4 h-4 mr-1" /> Limpar
        </Button>
      </CardHeader>
      <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Select value={currentFilters.block_id || 'all'} onValueChange={(val) => handleFilterChange('block_id', val)}>
          <SelectTrigger><SelectValue placeholder="Bloco" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Blocos</SelectItem>
            {configData?.blocks.map(b => <SelectItem key={b.id} value={b.name}>{`Bloco ${b.name}`}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={currentFilters.status || 'all'} onValueChange={(val) => handleFilterChange('status', val)}>
          <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="Aberta">Aberta</SelectItem>
            <SelectItem value="Conferida">Conferida</SelectItem>
          </SelectContent>
        </Select>

        <Select value={currentFilters.result || 'all'} onValueChange={(val) => handleFilterChange('result', val)}>
          <SelectTrigger><SelectValue placeholder="Resultado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Resultados</SelectItem>
            <SelectItem value="Concluída">Concluída</SelectItem>
            <SelectItem value="Inconcluída">Inconcluída</SelectItem>
          </SelectContent>
        </Select>

        <Select value={currentFilters.service_type_id || 'all'} onValueChange={(val) => handleFilterChange('service_type_id', val)}>
          <SelectTrigger><SelectValue placeholder="Serviço" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Serviços</SelectItem>
            {configData?.serviceTypes.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
};

export default MeasurementsFilterPanel;