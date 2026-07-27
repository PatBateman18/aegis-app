// hooks/usePremium.ts
// Lit le statut premium stocké sur profiles. Pour l'instant, ce champ est
// mis à jour manuellement (SQL) le temps qu'on branche RevenueCat — une fois
// connecté, un webhook mettra à jour is_premium/premium_expires_at automatiquement
// à chaque achat, renouvellement, ou expiration.

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function usePremium(userId: string | undefined) {
  const [isPremium, setIsPremium] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('profiles')
      .select('is_premium, premium_expires_at')
      .eq('id', userId)
      .single();

    if (error) console.error('[usePremium] load failed:', error);

    const expires = (data as any)?.premium_expires_at as string | null;
    // Sécurité : même si is_premium=true en base, on vérifie que la date
    // d'expiration n'est pas déjà passée (au cas où le webhook aurait du retard).
    const stillValid = !expires || new Date(expires) > new Date();

    setIsPremium(!!(data as any)?.is_premium && stillValid);
    setExpiresAt(expires);
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  return { isPremium, expiresAt, loading, reload: load };
}
