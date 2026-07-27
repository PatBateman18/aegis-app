// hooks/usePause.ts
// Pause annoncée : l'utilisateur prévient qu'il part X jours (vacances,
// maladie...). Toutes les dates de cette période sont gelées pour le calcul
// de streak — distinct du bouclier (gagné automatiquement, 1 jour max par
// usage) : ici c'est volontaire, annoncé à l'avance, et peut couvrir
// plusieurs jours d'un coup.

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export function usePause(userId: string | undefined) {
  const [pausedDates, setPausedDates] = useState<string[]>([]);
  const [pauseUntil, setPauseUntil] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    load();
  }, [userId]);

  async function load() {
    const { data, error } = await supabase
      .from('profiles')
      .select('paused_dates, pause_until')
      .eq('id', userId)
      .single();

    if (error) console.error('[usePause] load failed:', error);
    if (data) {
      setPausedDates((data as any).paused_dates ?? []);
      setPauseUntil((data as any).pause_until ?? null);
    }
    setLoading(false);
  }

  // Déclare une pause de `days` jours à partir d'aujourd'hui (aujourd'hui inclus)
  const startPause = useCallback(async (days: number) => {
    if (!userId || days < 1) return;

    const dates: string[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }
    const until = dates[dates.length - 1];

    const nextDates = Array.from(new Set([...pausedDates, ...dates]));
    setPausedDates(nextDates);
    setPauseUntil(until);

    const { error } = await supabase
      .from('profiles')
      .update({ paused_dates: nextDates, pause_until: until })
      .eq('id', userId);

    if (error) console.error('[usePause] startPause failed:', error);
  }, [userId, pausedDates]);

  // Termine la pause avant la date prévue (retour anticipé)
  const cancelPause = useCallback(async () => {
    if (!userId) return;
    const today = todayStr();
    // Retire uniquement les dates futures — les jours de pause déjà passés restent couverts
    const nextDates = pausedDates.filter(d => d < today);

    setPausedDates(nextDates);
    setPauseUntil(null);

    const { error } = await supabase
      .from('profiles')
      .update({ paused_dates: nextDates, pause_until: null })
      .eq('id', userId);

    if (error) console.error('[usePause] cancelPause failed:', error);
  }, [userId, pausedDates]);

  const isPausedToday = pausedDates.includes(todayStr());
  const isPauseActive = !!pauseUntil && pauseUntil >= todayStr();

  return { pausedDates, pauseUntil, isPausedToday, isPauseActive, loading, startPause, cancelPause };
}
