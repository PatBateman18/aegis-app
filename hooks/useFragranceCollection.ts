// hooks/useFragranceCollection.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { FRAGRANCES, Fragrance } from '@/constants/fragrances';

export function useFragranceCollection(userId: string | undefined) {
  const [keys, setKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    load();
  }, [userId]);

  async function load() {
    const { data, error } = await supabase
      .from('user_fragrance_collection')
      .select('fragrance_key')
      .eq('user_id', userId);

    if (error) console.error('[useFragranceCollection] load failed:', error);
    if (data) setKeys(data.map(d => d.fragrance_key));
    setLoading(false);
  }

  const isInCollection = useCallback((key: string) => keys.includes(key), [keys]);

  const addFragrance = useCallback(async (key: string) => {
    if (!userId || keys.includes(key)) return;
    setKeys(prev => [...prev, key]); // optimiste

    const { error } = await supabase
      .from('user_fragrance_collection')
      .upsert({ user_id: userId, fragrance_key: key }, { onConflict: 'user_id,fragrance_key' });

    if (error) {
      console.error('[useFragranceCollection] addFragrance failed:', error);
      setKeys(prev => prev.filter(k => k !== key)); // rollback
    }
  }, [userId, keys]);

  const removeFragrance = useCallback(async (key: string) => {
    if (!userId) return;
    setKeys(prev => prev.filter(k => k !== key)); // optimiste

    const { error } = await supabase
      .from('user_fragrance_collection')
      .delete()
      .eq('user_id', userId)
      .eq('fragrance_key', key);

    if (error) console.error('[useFragranceCollection] removeFragrance failed:', error);
  }, [userId]);

  const collection: Fragrance[] = keys
    .map(k => FRAGRANCES.find(f => f.key === k))
    .filter((f): f is Fragrance => !!f);

  return { collection, keys, loading, isInCollection, addFragrance, removeFragrance };
}
