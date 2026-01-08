"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Plus, Trash2, LayoutGrid } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import useConfigData from '@/hooks/use-config-data';
import { APARTMENT_NUMBERS } from '@/utils/construction-structure';

const ManageCeramicLots: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: configData } = useConfigData();
  
  const [selectedBlockId, setSelectedBlockId] = useState<string>('');
  const [selectedFloor, setSelectedFloor] = useState<string>('');
  const [selectedApartments, setSelectedApartments] = useState<string[]>([]);
  const [locationType, setLocationType] = useState<'Apartamento' | 'Circulação' | 'Sacada'>('Apartamento');
  
  const [lotNumber, setLotNumber] = useState('');
  const [productName, setProductName] = useState('');
  const [notes, setNotes] = useState('');

  // Filtra apartamentos baseados no andar selecionado
  const availableApartments = APARTMENT_NUMBERS.filter(apt => 
    apt.startsWith(selectedFloor) && !apt.startsWith('CIR')
  );

  const { data: lots, isLoading } = useQuery({
    queryKey: ['ceramicLots', selectedBlockId],
    queryFn: async () => {
      if (!selectedBlockId) return [];
      const { data, error } = await supabase.from('ceramic_lots').select('*').eq('block_id', selectedBlockId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedBlockId
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!selectedBlockId || !lotNumber) throw new Error('Bloco e Lote são obrigatórios.');
      
      const payloads: any[] = [];
      const floorInt = selectedFloor ? parseInt(selectedFloor) : null;

      if (locationType === 'Circulação') {
        payloads.push({
          block_id: selectedBlockId,
          lot_number: lotNumber,
          product_name: productName,
          location: 'Circulação',
          floor_number: floorInt,
          notes: notes
        });
      } else {
        if (selectedApartments.length === 0) throw new Error('Selecione ao menos um apartamento.');
        selectedApartments.forEach(apt => {
          payloads.push({
            block_id: selectedBlockId,
            lot_number: lotNumber,
            product_name: productName,
            location: locationType,
            floor_number: floorInt,
            apartment_number: apt,
            notes: notes
          });
        });
      }

      const { error } = await supabase.from('ceramic_lots').insert(payloads);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess('Cerâmicas registradas com sucesso.');
      setSelectedApartments([]);
      setLotNumber('');
      setProductName('');
      setNotes('');
      queryClient.invalidateQueries({ queryKey: ['ceramicLots', selectedBlockId] });
    },
    onError: (err: any) => showError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('ceramic_lots').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess('Registro excluído.');
      queryClient.invalidateQueries({ queryKey: ['ceramicLots', selectedBlockId] });
    },
  });

  return (
    <div className="space-y-6">
      <Card className="backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 shadow-xl border border-white/30">
        <CardHeader>
          <CardTitle className="flex items-center"><Plus className="w-5 h-5 mr-2" /> Novo Registro de Cerâmica</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Bloco *</Label>
              <Select value={selectedBlockId} onValueChange={setSelectedBlockId}>
                <SelectTrigger><SelectValue placeholder="Selecione o Bloco" /></SelectTrigger>
                <SelectContent>
                  {configData?.blocks.map(b => <SelectItem key={b.id} value={b.id}>{`Bloco ${b.name}`}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Andar *</Label>
              <Select value={selectedFloor} onValueChange={(val) => { setSelectedFloor(val); setSelectedApartments([]); }}>
                <SelectTrigger><SelectValue placeholder="Selecione o Andar" /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map(f => <SelectItem key={f} value={f.toString()}>{`${f}º Andar`}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo de Local</Label>
              <Select value={locationType} onValueChange={(val: any) => setLocationType(val)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Apartamento">Apartamento (Piso Interno)</SelectItem>
                  <SelectItem value="Sacada">Sacada</SelectItem>
                  <SelectItem value="Circulação">Circulação (Andar)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {locationType !== 'Circulação' && selectedFloor && (
            <div className="space-y-2">
              <Label>Apartamentos do {selectedFloor}º Andar *</Label>
              <ToggleGroup type="multiple" variant="outline" className="justify-start gap-2" value={selectedApartments} onValueChange={setSelectedApartments}>
                {availableApartments.map(apt => (
                  <ToggleGroupItem key={apt} value={apt} className="w-16 h-10">{apt}</ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nº do Lote *</Label>
              <Input value={lotNumber} onChange={(e) => setLotNumber(e.target.value)} placeholder="Ex: L123456" />
            </div>
            <div className="space-y-2">
              <Label>Nome/Modelo da Cerâmica</Label>
              <Input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="Ex: Porcelanato 60x60 Beige" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Observações (Opcional)</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Detalhes adicionais..." />
          </div>

          <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !selectedBlockId || !lotNumber} className="w-full">
            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            Registrar Cerâmica
          </Button>
        </CardContent>
      </Card>

      {selectedBlockId && (
        <Card className="backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 shadow-xl border border-white/30">
          <CardHeader><CardTitle className="text-lg flex items-center"><LayoutGrid className="w-5 h-5 mr-2" /> Registros Recentes no Bloco</CardTitle></CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Local</TableHead>
                    <TableHead>Lote</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lots && lots.length > 0 ? (
                    lots.slice(0, 10).map((lot: any) => (
                      <TableRow key={lot.id}>
                        <TableCell className="text-xs font-medium">
                          {lot.location} {lot.apartment_number || `${lot.floor_number}º Andar`}
                        </TableCell>
                        <TableCell className="text-xs">{lot.lot_number}</TableCell>
                        <TableCell className="text-xs">{lot.product_name}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(lot.id)} className="h-8 w-8 text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                        Nenhum registro encontrado para este bloco.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ManageCeramicLots;