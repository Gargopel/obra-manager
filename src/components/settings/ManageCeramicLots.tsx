import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Plus, Trash2, Edit, Save, X, BrickWall, Calendar } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import useConfigData from '@/hooks/use-config-data';
import { format } from 'date-fns';
import { Label } from '@/components/ui/label'; // Importação adicionada

interface CeramicLot {
  id: string;
  block_id: string;
  lot_number: string;
  manufacturer: string | null;
  product_name: string | null;
  purchase_date: string | null;
  created_at: string;
}

const fetchCeramicLots = async (blockId: string): Promise<CeramicLot[]> => {
  if (!blockId) return [];
  const { data, error } = await supabase
    .from('ceramic_lots')
    .select('*')
    .eq('block_id', blockId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as CeramicLot[];
};

const ManageCeramicLots: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: configData, isLoading: isLoadingConfig } = useConfigData();
  
  const [selectedBlockId, setSelectedBlockId] = useState<string | undefined>(undefined);
  const [newLotNumber, setNewLotNumber] = useState('');
  const [newManufacturer, setNewManufacturer] = useState('');
  const [newProductName, setNewProductName] = useState('');
  const [newPurchaseDate, setNewPurchaseDate] = useState(''); // YYYY-MM-DD format
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLot, setEditingLot] = useState<Partial<CeramicLot>>({});

  const { data: lots, isLoading, error } = useQuery<CeramicLot[], Error>({
    queryKey: ['ceramicLots', selectedBlockId],
    queryFn: () => fetchCeramicLots(selectedBlockId!),
    enabled: !!selectedBlockId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!selectedBlockId || !newLotNumber) throw new Error('Selecione o bloco e insira o número do lote.');
      
      const payload = {
        block_id: selectedBlockId,
        lot_number: newLotNumber.trim(),
        manufacturer: newManufacturer.trim() || null,
        product_name: newProductName.trim() || null,
        purchase_date: newPurchaseDate || null,
      };
      
      const { error } = await supabase.from('ceramic_lots').insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess('Lote de cerâmica cadastrado com sucesso.');
      setNewLotNumber('');
      setNewManufacturer('');
      setNewProductName('');
      setNewPurchaseDate('');
      queryClient.invalidateQueries({ queryKey: ['ceramicLots', selectedBlockId] });
    },
    onError: (error) => {
      showError('Erro ao cadastrar lote: ' + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (lot: Partial<CeramicLot>) => {
      if (!lot.id) throw new Error('ID do lote ausente.');
      
      const { error } = await supabase
        .from('ceramic_lots')
        .update({
          lot_number: lot.lot_number,
          manufacturer: lot.manufacturer,
          product_name: lot.product_name,
          purchase_date: lot.purchase_date,
        })
        .eq('id', lot.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess('Lote atualizado com sucesso.');
      setEditingId(null);
      setEditingLot({});
      queryClient.invalidateQueries({ queryKey: ['ceramicLots', selectedBlockId] });
    },
    onError: (error) => {
      showError('Erro ao atualizar lote: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('ceramic_lots').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess('Lote excluído com sucesso.');
      queryClient.invalidateQueries({ queryKey: ['ceramicLots', selectedBlockId] });
    },
    onError: (error) => {
      showError('Erro ao excluir lote: ' + error.message);
    },
  });

  const handleEdit = (lot: CeramicLot) => {
    setEditingId(lot.id);
    setEditingLot(lot);
  };

  const handleSave = () => {
    if (editingLot.lot_number) {
      updateMutation.mutate(editingLot);
    } else {
      showError('O número do lote não pode ser vazio.');
    }
  };
  
  const handleLotChange = (key: keyof CeramicLot, value: string) => {
    setEditingLot(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Card className="backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 shadow-xl border border-white/30 dark:border-gray-700/50">
      <CardHeader>
        <CardTitle className="flex items-center"><BrickWall className="w-5 h-5 mr-2" /> Gerenciar Lotes de Cerâmica</CardTitle>
      </CardHeader>
      <CardContent>
        
        {/* Seleção de Bloco */}
        <div className="mb-6 space-y-2">
          <Label htmlFor="block-select">Selecione o Bloco</Label>
          <Select 
            value={selectedBlockId} 
            onValueChange={setSelectedBlockId}
            disabled={isLoadingConfig}
          >
            <SelectTrigger id="block-select">
              <SelectValue placeholder="Escolha o Bloco para gerenciar lotes" />
            </SelectTrigger>
            <SelectContent>
              {configData?.blocks.map(block => (
                <SelectItem key={block.id} value={block.id}>{`Bloco ${block.name}`}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedBlockId && (
          <>
            {/* Formulário de Criação */}
            <div className="mb-8 p-4 border rounded-lg bg-accent/50">
              <h3 className="text-lg font-semibold mb-3">Adicionar Novo Lote ao Bloco {configData?.blocks.find(b => b.id === selectedBlockId)?.name}</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input 
                  placeholder="Nº do Lote (Obrigatório)" 
                  value={newLotNumber} 
                  onChange={(e) => setNewLotNumber(e.target.value)} 
                  required
                />
                <Input 
                  placeholder="Fabricante" 
                  value={newManufacturer} 
                  onChange={(e) => setNewManufacturer(e.target.value)} 
                />
                <Input 
                  placeholder="Nome do Produto" 
                  value={newProductName} 
                  onChange={(e) => setNewProductName(e.target.value)} 
                />
                <div className="flex items-center space-x-2">
                  <Input 
                    type="date"
                    value={newPurchaseDate} 
                    onChange={(e) => setNewPurchaseDate(e.target.value)} 
                    className="flex-1"
                  />
                  <Button 
                    onClick={() => createMutation.mutate()} 
                    disabled={!newLotNumber || createMutation.isPending}
                    size="icon"
                  >
                    {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>

            {/* Tabela de Lotes */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lote</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Fabricante</TableHead>
                    <TableHead className="w-[120px]">Data Compra</TableHead>
                    <TableHead className="w-[100px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={5} className="text-center"><Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" /></TableCell></TableRow>
                  ) : lots && lots.length > 0 ? (
                    lots.map((lot) => (
                      <TableRow key={lot.id}>
                        <TableCell className="font-medium">
                          {editingId === lot.id ? (
                            <Input 
                              value={editingLot.lot_number || ''} 
                              onChange={(e) => handleLotChange('lot_number', e.target.value)} 
                            />
                          ) : (
                            lot.lot_number
                          )}
                        </TableCell>
                        <TableCell>
                          {editingId === lot.id ? (
                            <Input 
                              value={editingLot.product_name || ''} 
                              onChange={(e) => handleLotChange('product_name', e.target.value)} 
                            />
                          ) : (
                            lot.product_name || 'N/A'
                          )}
                        </TableCell>
                        <TableCell>
                          {editingId === lot.id ? (
                            <Input 
                              value={editingLot.manufacturer || ''} 
                              onChange={(e) => handleLotChange('manufacturer', e.target.value)} 
                            />
                          ) : (
                            lot.manufacturer || 'N/A'
                          )}
                        </TableCell>
                        <TableCell>
                          {editingId === lot.id ? (
                            <Input 
                              type="date"
                              value={editingLot.purchase_date || ''} 
                              onChange={(e) => handleLotChange('purchase_date', e.target.value)} 
                            />
                          ) : (
                            lot.purchase_date ? format(new Date(lot.purchase_date), 'dd/MM/yyyy') : 'N/A'
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          {editingId === lot.id ? (
                            <>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={handleSave} 
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
                                onClick={() => handleEdit(lot)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => deleteMutation.mutate(lot.id)}
                                disabled={deleteMutation.isPending}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Nenhum lote cadastrado para este bloco.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </>
        )}
        {!selectedBlockId && (
          <p className="text-center text-muted-foreground mt-4">Selecione um bloco acima para gerenciar os lotes de cerâmica.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default ManageCeramicLots;