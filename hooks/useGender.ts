// hooks/useGender.ts
// Source de vérité locale pour le genre — AsyncStorage + fallback Supabase
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

const KEY = '@aegis:gender';

export async function saveGender(gender: 'male' | 'female') {
  await AsyncStorage.setItem(KEY, gender);
}

export async function loadGender(): Promise<string> {
  return (await AsyncStorage.getItem(KEY)) ?? 'male';
}

export function useGender(userId?: string): string {
  const [gender, setGender] = useState<string>('male');

  useEffect(() => {
    // 1. Lecture immédiate depuis AsyncStorage
    AsyncStorage.getItem(KEY).then(val => {
      if (val) { setGender(val); return; }

      // 2. Fallback Supabase si AsyncStorage vide
      if (!userId) return;
      supabase.from('profiles').select('gender').eq('id', userId).single()
        .then(({ data }) => {
          const g = data?.gender ?? 'male';
          setGender(g);
          AsyncStorage.setItem(KEY, g); // cache pour la prochaine fois
        });
    });
  }, [userId]);

  return gender;
}
