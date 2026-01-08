import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { QRCodeSVG } from 'qrcode.react';
import { BLOCKS, generateApartmentNumbers } from '@/utils/construction-structure';
import { Printer, Download, QrCode, ArrowRight } from 'lucide-react';

const ManageUnitQRCodes: React.FC = () => {
  const [selectedBlock, setSelectedBlock] = useState('A');
  const apartments = generateApartmentNumbers();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Painel de Controle (Escondido no Print) */}
      <Card className="print:hidden backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 shadow-xl border border-white/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" /> Gerador de Etiquetas de Unidade
          </CardTitle>
          <CardDescription>Gere os QR Codes para colar nas portas dos apartamentos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label>Selecione o Bloco</Label>
              <Select value={selectedBlock} onValueChange={setSelectedBlock}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BLOCKS.map(b => <SelectItem key={b} value={b}>Bloco {b}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700">
              <Printer className="w-4 h-4 mr-2" /> Imprimir Etiquetas do Bloco {selectedBlock}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Grade de Etiquetas para Impressão */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 print:grid-cols-3 print:gap-10">
        {apartments.map(apt => {
          const unitUrl = `${window.location.origin}/unit/${selectedBlock}/${apt}`;
          
          return (
            <div 
              key={apt} 
              className="p-6 border-2 border-black/10 rounded-2xl flex flex-col items-center bg-white shadow-sm print:shadow-none print:border-2 print:border-black/50"
            >
              <div className="text-center mb-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Obra Manager</p>
                <h3 className="text-2xl font-black leading-none">BLOCO {selectedBlock}</h3>
                <h4 className="text-lg font-bold text-blue-600">APTO {apt}</h4>
              </div>
              
              <div className="p-4 bg-white rounded-xl border-4 border-primary">
                <QRCodeSVG 
                  value={unitUrl} 
                  size={120} 
                  level="H" 
                  includeMargin={false}
                />
              </div>

              <div className="mt-4 flex items-center gap-1 text-[8px] font-bold text-muted-foreground uppercase text-center">
                <span>Escanear para Demandas e Cerâmicas</span>
                <ArrowRight className="w-2 h-2" />
              </div>
            </div>
          );
        })}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden; }
          .print\\:hidden { display: none !important; }
          #root { padding: 0 !important; margin: 0 !important; }
          .grid { visibility: visible; display: grid !important; position: absolute; left: 0; top: 0; width: 100%; }
          .grid * { visibility: visible; }
        }
      `}} />
    </div>
  );
};

export default ManageUnitQRCodes;