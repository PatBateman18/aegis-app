import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { DailyLog, Goals, mkDay, todayStr } from '@/constants/types';

export function useDay(userId: string | undefined, shieldDates: string[] = []) {
  const [day, setDay] = useState<DailyLog>(mkDay(todayStr()));
  const [goals, setGoals] = useState<Goals>({});
  const [history, setHistory] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);

  const today = todayStr();

  useEffect(() => {
    if (!userId) return;
    loadToday();
    loadHistory();
    loadGoals();
  }, [userId]);

  async function loadToday() {
    const { data, error: selErr } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle();

    if (selErr) console.error('[useDay] loadToday select failed:', selErr);

    if (data) {
      setDay(data as DailyLog);
    } else {
      // Crée le log du jour
      const newDay = { ...mkDay(today), user_id: userId };
      const { data: created, error: insErr } = await supabase
        .from('daily_logs')
        .insert(newDay)
        .select()
        .single();
      if (insErr) console.error('[useDay] loadToday insert failed:', insErr);
      if (created) setDay(created as DailyLog);
    }
    setLoading(false);
  }

  async function loadHistory() {
    const { data } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(60);
    if (data) setHistory(data as DailyLog[]);
  }

  async function loadGoals() {
    const { data } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (data) setGoals(data as Goals);
  }

  const updateDay = useCallback(async (updates: Partial<DailyLog>) => {
    if (!userId) return;

    // Optimistic update
    setDay(prev => ({ ...prev, ...updates }));

    // Upsert au lieu d'un simple update : si la ligne du jour n'existe pas
    // encore en base (insert initial raté, race condition au démarrage...),
    // un update classique matche 0 ligne et ne fait RIEN, sans erreur.
    // -> ça donnait l'impression que ça enregistrait (UI optimiste) alors
    //    qu'en base rien n'était persisté.
    const { data, error } = await supabase
      .from('daily_logs')
      .upsert(
        {
          user_id: userId,
          date: today,
          ...updates,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,date' }
      )
      .select()
      .single();

    if (error) {
      console.error('[useDay] updateDay failed:', error);
      return;
    }
    if (data) setDay(prev => ({ ...prev, ...(data as DailyLog) }));
  }, [userId, today]);

  const updateGoals = useCallback(async (updates: Partial<Goals>) => {
    if (!userId) return;
    setGoals(prev => ({ ...prev, ...updates }));
    await supabase
      .from('goals')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
  }, [userId]);

  // Calcule le streak — fusionne day actuel dans history pour éviter les données périmées
  const streak = (() => {
    let count = 0;
    // Remplace l'entrée d'aujourd'hui dans history par le day actuel (plus à jour)
    const merged = [
      day,
      ...history.filter(h => h.date !== today),
    ];
    const byDate = new Map(merged.map(d => [d.date, d]));
    const shieldSet = new Set(shieldDates);

    for (let i = 0; i < 3650; i++) { // limite large, pas de boucle infinie
      const expected = new Date();
      expected.setDate(expected.getDate() - i);
      const exp = expected.toISOString().split('T')[0];
      const log = byDate.get(exp);

      const habits = ['workout_done', 'calories_ok', 'learning_done', 'm_face', 'outfit_ok', 'morning_water'] as const;
      const done = log ? habits.filter(k => !!(log as any)[k]).length : 0;
      const score = log ? Math.round((done / habits.length) * 100) : 0;

      if (score >= 40) {
        count++;
      } else if (shieldSet.has(exp)) {
        // Jour manqué, mais couvert par un bouclier de streak — la série continue
        count++;
      } else {
        break;
      }
    }
    return count;
  })();

 return { day, goals, history, loading, streak, updateDay, updateGoals, loadHistory, loadToday };
}
