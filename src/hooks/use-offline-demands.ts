import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';

const STORAGE_KEY = 'offline_demands_queue';

export interface OfflineDemand {
  id: string;
  payload: any;
  timestamp: number;
  type: 'simple' | 'checklist';
}

export const useOfflineDemands = () => {
  const [drafts, setDrafts] = useState<OfflineDemand[]>([]);

  // Carrega rascunhos do localStorage ao iniciar
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setDrafts(JSON.parse(saved));
      } catch (e) {
        console.error("Erro ao carregar rascunhos:", e);
      }
    }
  }, []);

  const saveDraft = (payload: any | any[], type: 'simple' | 'checklist') => {
    const newDraft: OfflineDemand = {
      id: crypto.randomUUID(),
      payload,
      timestamp: Date.now(),
      type
    };
    
    const updated = [...drafts, newDraft];
    setDrafts(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    showSuccess("Salvo localmente! Sincronize quando tiver internet.");
  };

  const removeDraft = (id: string) => {
    const updated = drafts.filter(d => d.id !== id);
    setDrafts(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const syncAll = async () => {
    if (drafts.length === 0) return;
    
    let successCount = 0;
    let failCount = 0;

    for (const draft of drafts) {
      try {
        const { error } = await supabase.from('demands').insert(draft.payload);
        if (error) throw error;
        
        successCount++;
        // Remove da lista após sucesso
        const currentDrafts = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        const filtered = currentDrafts.filter((d: any) => d.id !== draft.id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      } catch (e) {
        failCount++;
        console.error("Erro ao sincronizar item:", e);
      }
    }

    // Atualiza estado local
    const finalDrafts = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    setDrafts(finalDrafts);

    if (successCount > 0) showSuccess(`${successCount} demandas sincronizadas com sucesso!`);
    if (failCount > 0) showError(`${failCount} falharam. Tente novamente.`);
  };

  return {
    drafts,
    saveDraft,
    removeDraft,
    syncAll,
    hasDrafts: drafts.length > 0
  };
};