import React from 'react';
import { CloudUpload, Trash2, RefreshCcw, WifiOff, FileText, LayoutGrid } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useOfflineDemands } from '@/hooks/use-offline-demands';
import { format } from 'date-fns';

const SyncPage: React.FC = () => {
  const { drafts, syncAll, removeDraft, hasDrafts } = useOfflineDemands();

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center">
          <CloudUpload className="w-8 h-8 mr-3 text-primary" />
          Central de Sincronização
        </h1>
        {hasDrafts && (
          <Button onClick={syncAll} className="bg-green-600 hover:bg-green-700">
            <RefreshCcw className="w-4 h-4 mr-2" /> Sincronizar Tudo
          </Button>
        )}
      </div>

      {!hasDrafts ? (
        <Card className="text-center p-12 backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 border-dashed">
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 bg-accent rounded-full text-muted-foreground">
              <CloudUpload className="w-12 h-12" />
            </div>
            <h2 className="text-xl font-semibold">Tudo em dia!</h2>
            <p className="text-muted-foreground">Não há demandas pendentes de sincronização neste aparelho.</p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          <p className="text-sm text-muted-foreground bg-yellow-100 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-900/30 flex items-center">
            <WifiOff className="w-4 h-4 mr-2" /> 
            Você possui {drafts.length} registros salvos localmente. Eles só estarão visíveis para os outros usuários após a sincronização.
          </p>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {drafts.map((draft) => (
              <Card key={draft.id} className="bg-white/80 dark:bg-gray-800/80 shadow-md">
                <CardHeader className="p-4">
                  <div className="flex justify-between items-start">
                    <Badge variant="outline">
                      {draft.type === 'simple' ? 'Demanda Simples' : 'Checklist Apto'}
                    </Badge>
                    <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => removeDraft(draft.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardTitle className="text-sm mt-2">
                    Criado em {format(draft.timestamp, 'dd/MM/yyyy HH:mm')}
                  </CardTitle>
                  <CardDescription className="text-xs truncate">
                    ID: {draft.id}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-xs space-y-1">
                    {Array.isArray(draft.payload) ? (
                      <p>Contém {draft.payload.length} itens no checklist.</p>
                    ) : (
                      <p>Bloco {draft.payload.block_id} - Apto {draft.payload.apartment_number}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SyncPage;