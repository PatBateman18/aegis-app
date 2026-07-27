// hooks/useMentor.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { type MentorId, defaultMentorForGender } from '@/constants/mentors';

export function useMentor(userId: string | undefined, gender: string) {
  const [mentorId, setMentorIdState] = useState<MentorId | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('mentor_id')
      .eq('id', userId)
      .single();

    if (error) console.error('[useMentor] load failed:', error);
    const stored = (data as any)?.mentor_id as MentorId | undefined;
    setMentorIdState(stored ?? defaultMentorForGender(gender));
    setLoading(false);
  }, [userId, gender]);

  useEffect(() => { load(); }, [load]);

  const setMentorId = useCallback(async (id: MentorId) => {
    setMentorIdState(id);
    if (!userId) return;
    const { error } = await supabase.from('profiles').update({ mentor_id: id }).eq('id', userId);
    if (error) console.error('[useMentor] setMentorId failed:', error);
  }, [userId]);

  return { mentorId, setMentorId, loading };
}
