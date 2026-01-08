import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Plus, Trash2, Edit, Save, X, Wrench, Layers } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface ServiceItem {
  id: string;
  name: string;
}

const ManageServiceTypes: React.FC = () => {
  const queryClient = useQueryClient();
  const [newItemName, setNewItemName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const { data: config, isLoading } = useQuery({
    queryKey: ['configData'],
    queryFn: async () => {
      const { data: services } = await supabase.from('service_types').select('*').order('name');
      const { data: deps } = await supabase.from('service_dependencies').select('*');
      return { services: services || [], deps: deps || [] };
    }
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.from('service_types').insert({ name });
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess('Serviço criado.');
      setNewItemName('');
      queryClient.invalidateQueries({ queryKey: ['configData'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('service_types').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess('Serviço excluído.');
      queryClient.invalidateQueries({ queryKey: ['configData'] });
    },
  });

  const toggleDependency = async (serviceId: string, dependsOnId: string, current: boolean) => {
    if (current) {
      await supabase.from('service_dependencies').delete().eq('service_id', serviceId).eq('depends_on_id', dependsOnId);
    } else {
      await supabase.from('service_dependencies').insert({ service_id: serviceId, depends_on_id: dependsOnId });
    }
    queryClient.invalidateQueries({ queryKey: ['configData'] });
    showSuccess('Dependência atualizada.');
  };

  if (isLoading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

  return (
    <Card className="backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 shadow-xl border border-white/30">
      <CardHeader>
        <CardTitle className="flex items-center"><Wrench className="w-5 h-5 mr-2" /> Tipos de Serviço e Dependências</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-2 mb-6">
          <Input placeholder="Novo serviço" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} />
          <Button onClick={() => createMutation.mutate(newItemName)} disabled={!newItemName.trim() || createMutation.isPending}>
            <Plus className="w-4 h-4 mr-2" /> Adicionar
          </Button>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome do Serviço</TableHead>
                <TableHead>Depende de...</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {config?.services.map((service) => {
                const myDeps = config.deps.filter(d => d.service_id === service.id);
                return (
                  <TableRow key={service.id}>
                    <TableCell className="font-bold">{service.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {myDeps.map(d => (
                          <Badge key={d.depends_on_id} variant="secondary" className="bg-blue-100 text-blue-800">
                            {config.services.find(s => s.id === d.depends_on_id)?.name}
                          </Badge>
                        ))}
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]"><Plus className="w-3 h-3 mr-1" /> Config. Dependências</Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-64 p-3">
                            <h4 className="font-bold text-xs mb-3 uppercase">Marque os pré-requisitos:</h4>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                              {config.services.filter(s => s.id !== service.id).map(s => (
                                <div key={s.id} className="flex items-center space-x-2">
                                  <Checkbox 
                                    id={`dep-${service.id}-${s.id}`} 
                                    checked={myDeps.some(d => d.depends_on_id === s.id)}
                                    onCheckedChange={(val) => toggleDependency(service.id, s.id, !val)}
                                  />
                                  <Label htmlFor={`dep-${service.id}-${s.id}`} className="text-xs cursor-pointer">{s.name}</Label>
                                </div>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(service.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ManageServiceTypes;