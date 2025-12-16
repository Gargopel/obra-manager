import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Plus, Trash2, Edit, Save, X } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { Icon as LucideIcon } from 'lucide-react';

interface ConfigItem {
  id: string;
  name: string;
}

interface ManageConfigProps {
  configType: 'service_types' | 'rooms';
  title: string;
  icon: LucideIcon;
}

const ManageConfig: React.FC<ManageConfigProps> = ({ configType, title, icon: Icon }) => {
  const queryClient = useQueryClient();
  const [newItemName, setNewItemName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // Helper function to extract the noun (e.g., 'Serviço' or 'Cômodo') for toast messages and placeholders
  const getItemNoun = () => {
    const parts = title.split(' ');
    // We assume the noun is the last word of the title.
    return parts.pop() || 'Item';
  };
  
  const itemName = getItemNoun();

  const { data: items, isLoading, error } = useQuery<ConfigItem[], Error>({
    queryKey: [configType],
    queryFn: async () => {
      const { data, error } = await supabase.from(configType).select('id, name').order('name');
      if (error) throw error;
      return data as ConfigItem[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.from(configType).insert({ name });
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess(`${itemName} criado com sucesso.`);
      setNewItemName('');
      queryClient.invalidateQueries({ queryKey: [configType] });
      queryClient.invalidateQueries({ queryKey: ['configData'] });
    },
    onError: (error) => {
      showError('Erro ao criar: ' + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.from(configType).update({ name }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess(`${itemName} atualizado com sucesso.`);
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: [configType] });
      queryClient.invalidateQueries({ queryKey: ['configData'] });
    },
    onError: (error) => {
      showError('Erro ao atualizar: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(configType).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess(`${itemName} excluído com sucesso.`);
      queryClient.invalidateQueries({ queryKey: [configType] });
      queryClient.invalidateQueries({ queryKey: ['configData'] });
    },
    onError: (error) => {
      showError('Erro ao excluir. Verifique se não há demandas associadas.');
    },
  });

  const handleEdit = (item: ConfigItem) => {
    setEditingId(item.id);
    setEditingName(item.name);
  };

  const handleSave = (id: string) => {
    if (editingName.trim()) {
      updateMutation.mutate({ id, name: editingName.trim() });
    }
  };

  if (isLoading) {
    return <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (error) {
    return <div className="text-red-500">Erro ao carregar dados: {error.message}</div>;
  }

  return (
    <Card className="backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 shadow-xl border border-white/30 dark:border-gray-700/50">
      <CardHeader>
        <CardTitle className="flex items-center"><Icon className="w-5 h-5 mr-2" /> {title}</CardTitle>
      </CardHeader>
      <CardContent>
        
        {/* Formulário de Criação */}
        <div className="flex space-x-2 mb-6">
          <Input
            placeholder={`Novo nome do ${itemName.toLowerCase()}`}
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            className="flex-1"
          />
          <Button 
            onClick={() => createMutation.mutate(newItemName.trim())} 
            disabled={!newItemName.trim() || createMutation.isPending}
          >
            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
            Adicionar
          </Button>
        </div>

        {/* Tabela de Itens */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="w-[150px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {editingId === item.id ? (
                      <Input 
                        value={editingName} 
                        onChange={(e) => setEditingName(e.target.value)} 
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSave(item.id); }}
                      />
                    ) : (
                      item.name
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {editingId === item.id ? (
                      <>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleSave(item.id)}
                          disabled={updateMutation.isPending}
                        >
                          <Save className="w-4 h-4 text-green-600" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setEditingId(null)}
                        >
                          <X className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleEdit(item)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => deleteMutation.mutate(item.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ManageConfig;