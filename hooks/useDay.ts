import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { DailyLog, Goals, mkDay, todayStr } from '@/constants/types';

export function useDay(userId: string | undefined) {
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
    const { data } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle();

    if (data) {
      setDay(data as DailyLog);
    } else {
      // Crée le log du jour
      const newDay = { ...mkDay(today), user_id: userId };
      const { data: created } = await supabase
        .from('daily_logs')
        .insert(newDay)
        .select()
        .single();
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

    await supabase
      .from('daily_logs')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('date', today);
  }, [userId, today]);

  const updateGoals = useCallback(async (updates: Partial<Goals>) => {
    if (!userId) return;
    setGoals(prev => ({ ...prev, ...updates }));
    await supabase
      .from('goals')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
  }, [userId]);

  // Calcule le streak
  const streak = (() => {
    let count = 0;
    const sorted = [...history].sort((a, b) => b.date.localeCompare(a.date));
    for (let i = 0; i < sorted.length; i++) {
      const expected = new Date();
      expected.setDate(expected.getDate() - i);
      const exp = expected.toISOString().split('T')[0];
      const log = sorted[i];
      if (!log || log.date !== exp) break;
      const habits = ['workout_done', 'calories_ok', 'learning_done', 'm_face', 'outfit_ok', 'morning_water'] as const;
      const done = habits.filter(k => !!(log as any)[k]).length;
      const score = Math.round((done / habits.length) * 100);
      if (score >= 40) count++;
      else break;
    }
    return count;
  })();

 return { day, goals, history, loading, streak, updateDay, updateGoals, loadHistory, loadToday };
}
