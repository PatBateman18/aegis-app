// hooks/useStreakShields.ts
// Bouclier de streak : protège un jour manqué sans casser la série.
// Gagné automatiquement tous les DAYS_PER_SHIELD jours actifs (jamais acheté),
// consommé silencieusement dès qu'un jour manqué est détecté au retour —
// aucune action de l'utilisateur à faire, ça se passe en arrière-plan.
//
// Usage : appelle syncShields(day, history) une fois que day/history sont
// chargés (depuis useDay), typiquement dans le composant Dashboard ou Profil.
// Le hook s'occupe de tout : détection du jour manqué, consommation du
// bouclier si dispo, et progression vers le prochain bouclier.

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { DailyLog, calcScore } from '@/constants/types';

const MAX_SHIELDS = 3;
const DAYS_PER_SHIELD = 14;
const SCORE_THRESHOLD = 40; // même seuil que le calcul de streak dans useDay

export function useStreakShields(userId: string | undefined) {
  const [shields, setShields] = useState(0);
  const [shieldDates, setShieldDates] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const syncedRef = useRef<string | null>(null); // évite de resynchroniser plusieurs fois pour la même date

  useEffect(() => {
    if (!userId) return;
    load();
  }, [userId]);

  async function load() {
    const { data, error } = await supabase
      .from('profiles')
      .select('streak_shields, streak_shield_dates, streak_shield_progress')
      .eq('id', userId)
      .single();

    if (error) console.error('[useStreakShields] load failed:', error);
    if (data) {
      setShields((data as any).streak_shields ?? 0);
      setShieldDates((data as any).streak_shield_dates ?? []);
      setProgress((data as any).streak_shield_progress ?? 0);
    }
    setLoading(false);
  }

  // Vérifie s'il y a un jour manqué à couvrir + fait progresser le compteur.
  // À appeler une fois par session avec le day/history déjà chargés ailleurs.
  const syncShields = useCallback(async (day: DailyLog, history: DailyLog[]) => {
    if (!userId) return;
    const today = day.date;
    if (syncedRef.current === today) return; // déjà fait pour aujourd'hui
    syncedRef.current = today;

    const allDays = [...history.filter(h => h.date !== today), day]
      .sort((a, b) => b.date.localeCompare(a.date));

    // Le jour d'hier a-t-il été manqué (pas de log, ou score insuffisant, et pas déjà couvert) ?
    const yesterday = new Date(today + 'T00:00:00');
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const yesterdayLog = allDays.find(d => d.date === yesterdayStr);
    const yesterdayScore = yesterdayLog ? calcScore(yesterdayLog) : 0;
    const yesterdayMissed = yesterdayScore < SCORE_THRESHOLD;
    const alreadyCovered = shieldDates.includes(yesterdayStr);

    let nextShields = shields;
    let nextShieldDates = shieldDates;
    let changed = false;

    if (yesterdayMissed && !alreadyCovered && shields > 0) {
      // Consomme un bouclier, silencieusement — hier est maintenant "sauvé"
      nextShields = shields - 1;
      nextShieldDates = [...shieldDates, yesterdayStr];
      changed = true;
    }

    // Progression vers le prochain bouclier : +1 si aujourd'hui est un jour réussi
    // (ou hier vient d'être sauvé par un bouclier, ce qui compte comme continuité)
    const todayScore = calcScore(day);
    const todayCounts = todayScore >= SCORE_THRESHOLD;
    let nextProgress = progress;

    if (todayCounts) {
      nextProgress = progress + 1;
      if (nextProgress >= DAYS_PER_SHIELD) {
        nextProgress = 0;
        if (nextShields < MAX_SHIELDS) nextShields += 1;
      }
      changed = true;
    }

    if (changed) {
      setShields(nextShields);
      setShieldDates(nextShieldDates);
      setProgress(nextProgress);

      const { error } = await supabase
        .from('profiles')
        .update({
          streak_shields: nextShields,
          streak_shield_dates: nextShieldDates,
          streak_shield_progress: nextProgress,
        })
        .eq('id', userId);

      if (error) console.error('[useStreakShields] sync failed:', error);
    }
  }, [userId, shields, shieldDates, progress]);

  return { shields, shieldDates, progress, maxShields: MAX_SHIELDS, daysPerShield: DAYS_PER_SHIELD, loading, syncShields };
}
