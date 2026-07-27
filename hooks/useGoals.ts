// hooks/useGoals.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export type GoalStatus = 'not_started' | 'in_progress' | 'achieved';

export type Goal = {
  id: string;
  title: string;
  description: string;
  deadline: string | null;
  status: GoalStatus;
  icon_key: string;
  created_at: string;
};

export function useGoals(userId: string | undefined) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    load();
  }, [userId]);

  async function load() {
    const { data, error } = await supabase
      .from('user_goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) console.error('[useGoals] load failed:', error);
    if (data) setGoals(data as Goal[]);
    setLoading(false);
  }

  const addGoal = useCallback(async (input: { title: string; description: string; deadline: string | null; icon_key: string }) => {
    if (!userId) return;
    const optimistic: Goal = {
      id: `temp-${Date.now()}`,
      title: input.title,
      description: input.description,
      deadline: input.deadline,
      status: 'not_started',
      icon_key: input.icon_key,
      created_at: new Date().toISOString(),
    };
    setGoals(prev => [...prev, optimistic]);

    const { data, error } = await supabase
      .from('user_goals')
      .insert({ user_id: userId, ...input, status: 'not_started' })
      .select()
      .single();

    if (error) {
      console.error('[useGoals] addGoal failed:', error);
      setGoals(prev => prev.filter(g => g.id !== optimistic.id));
      return;
    }
    if (data) setGoals(prev => prev.map(g => (g.id === optimistic.id ? (data as Goal) : g)));
  }, [userId]);

  const updateStatus = useCallback(async (id: string, status: GoalStatus) => {
    setGoals(prev => prev.map(g => (g.id === id ? { ...g, status } : g))); // optimiste

    const { error } = await supabase
      .from('user_goals')
      .update({ status })
      .eq('id', id);

    if (error) console.error('[useGoals] updateStatus failed:', error);
  }, []);

  const deleteGoal = useCallback(async (id: string) => {
    const prev = goals;
    setGoals(g => g.filter(x => x.id !== id)); // optimiste

    const { error } = await supabase.from('user_goals').delete().eq('id', id);
    if (error) {
      console.error('[useGoals] deleteGoal failed:', error);
      setGoals(prev); // rollback
    }
  }, [goals]);

  return { goals, loading, addGoal, updateStatus, deleteGoal };
}
