// hooks/useHabitAchievements.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { HABIT_KEYS } from '@/constants/types';
import { getAllAchievements, HABIT_MILESTONES, PERFECT_DAY_MILESTONES } from '@/constants/achievements';

export function useHabitAchievements(userId: string | undefined) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    const nextCounts: Record<string, number> = {};

    // Un count exact par habitude — pas besoin de rapatrier les lignes
    await Promise.all(
      HABIT_KEYS.map(async (key) => {
        const { count, error } = await supabase
          .from('daily_logs')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq(key as string, true);
        if (error) console.error(`[useHabitAchievements] count ${String(key)} failed:`, error);
        nextCounts[key as string] = count ?? 0;
      })
    );

    // Jour Parfait : les 6 habitudes vraies sur la même ligne
    let query = supabase
      .from('daily_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    for (const key of HABIT_KEYS) query = query.eq(key as string, true);
    const { count: perfectCount, error: perfectError } = await query;
    if (perfectError) console.error('[useHabitAchievements] perfect_day count failed:', perfectError);
    nextCounts['perfect_day'] = perfectCount ?? 0;

    setCounts(nextCounts);
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const achievements = getAllAchievements();
  const unlockedIds = new Set(
    achievements.filter(a => (counts[a.habitKey] ?? 0) >= a.threshold).map(a => a.id)
  );

  const unlockedCount = unlockedIds.size;
  const totalCount = achievements.length;
  const masterUnlocked = unlockedCount === totalCount && totalCount > 0;

  return { counts, achievements, unlockedIds, unlockedCount, totalCount, masterUnlocked, loading, reload: load };
}
