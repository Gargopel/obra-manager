import React, { useState } from 'react';
import { Ruler, Filter, PlusCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSession } from '@/contexts/SessionContext';
import useSiteConfig from '@/hooks/use-site-config';
import MeasurementsFilterPanel from '@/components/measurements/MeasurementsFilterPanel';
import MeasurementsList from '@/components/measurements/MeasurementsList';
import CreateMeasurementDialog from '@/components/measurements/CreateMeasurementDialog';
import useMeasurements from '@/hooks/use-measurements';
import { exportToPdf } from '@/utils/pdf-export';

const MeasurementsPage: React.FC = () => {
  const { profile, isAdmin } = useSession();
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [filters, setFilters] = useState({});
  const { data: siteConfig } = useSiteConfig();
  const { data: measurements } = useMeasurements(filters);
  
  React.useEffect(() => {
    if (siteConfig?.site_name) document.title = siteConfig.site_name + ' - Medição';
  }, [siteConfig]);

  const handleExportPdf = () => {
    if (!measurements || measurements.length === 0) return;
    
    const columns = ['Bloco', 'Local', 'Serviço', 'Solicitante', 'Status', 'Resultado', 'Data'];
    const rows = measurements.map(m => [
      m.block_id,
      m.apartment_number ? `Apto ${m.apartment_number}` : `${m.floor_number}º Andar`,
      m.service_type_name,
      m.requester_first_name,
      m.status,
      m.result || 'Pendente',
      new Date(m.created_at).toLocaleDateString('pt-BR')
    ]);

    exportToPdf({
      title: 'Relatório de Medições e Conferências',
      filename: 'medicoes',
      columns,
      rows,
      siteName: siteConfig?.site_name
    });
  };

  const canCreate = isAdmin || profile?.can_measure;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground/90 backdrop-blur-sm p-2 rounded-lg max-w-full">
          <Ruler className="inline-block w-8 h-8 mr-2 text-primary" />
          Medição e Conferência
        </h1>
        <div className="flex space-x-4 flex-shrink-0">
          <Button variant="outline" onClick={handleExportPdf} disabled={!measurements || measurements.length === 0} className="backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 border border-white/30">
            <FileText className="w-4 h-4 mr-2" /> PDF
          </Button>
          <Button variant="outline" onClick={() => setIsFilterOpen(!isFilterOpen)} className="backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 border border-white/30">
            <Filter className="w-4 h-4 mr-2" /> Filtros
          </Button>
          {canCreate && (
            <Button onClick={() => setIsCreateOpen(true)}>
              <PlusCircle className="w-4 h-4 mr-2" /> Solicitar Conferência
            </Button>
          )}
        </div>
      </div>

      {isFilterOpen && <MeasurementsFilterPanel onApplyFilters={setFilters} />}
      <MeasurementsList filters={filters} />
      {canCreate && <CreateMeasurementDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />}
    </div>
  );
};

export default MeasurementsPage;