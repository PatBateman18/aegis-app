// hooks/useWeeklyRecap.ts
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { calcDayXP } from '@/constants/rpg';
import { calcScore, HABIT_KEYS, HABIT_LABELS, DailyLog } from '@/constants/types';
import { type WeekRecapData } from '@/components/WeeklyRecapModal';

const STORAGE_KEY = '@aegis:last_recap_week';

// Retourne "YYYY-Wnn" pour identifier la semaine
function getWeekId(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7)); // jeudi de la semaine ISO
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

// Dates lun→dim de la semaine PRÉCÉDENTE
function getLastWeekRange(): { start: string; end: string; label: string } {
  const today = new Date();
  const day   = today.getDay(); // 0=dim, 1=lun...
  const monday = new Date(today);
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1) - 7); // lundi semaine passée
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const fmt = (d: Date) => d.toISOString().split('T')[0];
  const fmtLabel = (d: Date) =>
    d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }).toUpperCase();

  return {
    start: fmt(monday),
    end:   fmt(sunday),
    label: `${fmtLabel(monday)} – ${fmtLabel(sunday)}`,
  };
}

function buildVerdict(avgScore: number, workouts: number): Pick<WeekRecapData, 'verdict' | 'verdictSub' | 'verdictColor'> {
  if (avgScore >= 85 && workouts >= 4) return { verdict: '⚔️ SEMAINE DE CONQUÉRANT',  verdictSub: 'Tu as dominé. La transformation avance.',        verdictColor: '#E8C46A' };
  if (avgScore >= 70)                  return { verdict: '🔥 SEMAINE SOLIDE',           verdictSub: 'Bonne régularité. Pousse encore cette semaine.',  verdictColor: '#C9A84C' };
  if (avgScore >= 50)                  return { verdict: '⚡ EN PROGRESSION',            verdictSub: "L'élan est là. Ne le laisse pas tomber.",         verdictColor: '#C9A84C' };
  if (avgScore >= 25)                  return { verdict: '🛡️ SEMAINE DIFFICILE',         verdictSub: 'Cette semaine est une nouvelle chance.',           verdictColor: '#545048' };
  return                                      { verdict: '💀 SEMAINE PERDUE',            verdictSub: "Tu sais ce qu'il reste à faire. Relève-toi.",      verdictColor: '#D94F4F' };
}

export function useWeeklyRecap(userId: string | undefined) {
  const [showRecap, setShowRecap] = useState(false);
  const [recapData, setRecapData] = useState<WeekRecapData | null>(null);

  useEffect(() => {
    if (!userId) return;
    checkAndTrigger();
  }, [userId]);

  async function checkAndTrigger() {
    const today = new Date();

    // Déclenche uniquement le lundi
    if (today.getDay() !== 1) return;

    // Vérifie si déjà montré cette semaine
    const currentWeekId = getWeekId(today);
    const lastShown = await AsyncStorage.getItem(STORAGE_KEY);
    if (lastShown === currentWeekId) return;

    // Fetch les logs de la semaine passée
    const { start, end, label } = getLastWeekRange();
    const { data } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('date', start)
      .lte('date', end);

    const logs: DailyLog[] = data ?? [];

    // Pas de données → on ne montre rien mais on marque quand même
    if (logs.length === 0) {
      await AsyncStorage.setItem(STORAGE_KEY, currentWeekId);
      return;
    }

    // Calculs
    const scores      = logs.map(calcScore);
    const avgScore    = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const totalXP     = logs.reduce((acc, d) => acc + calcDayXP(d), 0);
    const workouts    = logs.filter(d => d.workout_done).length;
    const perfectDays = logs.filter(d => calcScore(d) === 100).length;

    // Meilleure habitude
    const habitRates = HABIT_KEYS.map(k => ({
      label: HABIT_LABELS[k as string],
      rate:  Math.round((logs.filter(d => !!(d as any)[k]).length / logs.length) * 100),
    })).sort((a, b) => b.rate - a.rate);
    const best = habitRates[0];

    const verdict = buildVerdict(avgScore, workouts);

    setRecapData({
      weekLabel: label,
      avgScore,
      totalXP,
      workouts,
      perfectDays,
      bestHabit:     best.label,
      bestHabitRate: best.rate,
      ...verdict,
    });

    setShowRecap(true);

    // Marque comme montré
    await AsyncStorage.setItem(STORAGE_KEY, currentWeekId);
  }

  function closeRecap() {
    setShowRecap(false);
  }

  return { showRecap, recapData, closeRecap };
}
