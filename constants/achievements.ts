// constants/achievements.ts
// Succès par habitude : chaque champ de DailyLog a ses propres paliers de
// validations à vie (1, 3, 5, 10...), plus un palier séparé "Jour Parfait"
// (les 6 habitudes validées le même jour). Regroupé par champ réel plutôt
// que par page, pour éviter toute ambiguïté vu que plusieurs pages
// réutilisent les mêmes 6 champs sous des étiquettes différentes.

import { HABIT_KEYS, HABIT_LABELS, DailyLog } from './types';

export const HABIT_MILESTONES = [1, 3, 5, 10, 25, 50, 100, 250];
export const PERFECT_DAY_MILESTONES = [1, 3, 5, 10, 25, 50, 100];

export type Achievement = {
  id: string;
  habitKey: string;       // une des HABIT_KEYS, ou 'perfect_day'
  threshold: number;
  title: string;
  description: string;
};

function titleFor(label: string, n: number): string {
  if (n === 1) return `Première fois : ${label}`;
  return `${label} × ${n}`;
}

// ─── Génère les succès pour chaque habitude ───────────────────────────────────
export function getHabitAchievements(): Achievement[] {
  const list: Achievement[] = [];
  for (const key of HABIT_KEYS) {
    const label = HABIT_LABELS[key as string] ?? key;
    for (const n of HABIT_MILESTONES) {
      list.push({
        id: `${key}_${n}`,
        habitKey: key as string,
        threshold: n,
        title: titleFor(label, n),
        description: `Valide "${label}" ${n} fois au total.`,
      });
    }
  }
  return list;
}

// ─── Génère les succès "Jour Parfait" (les 6 habitudes le même jour) ─────────
export function getPerfectDayAchievements(): Achievement[] {
  return PERFECT_DAY_MILESTONES.map(n => ({
    id: `perfect_day_${n}`,
    habitKey: 'perfect_day',
    threshold: n,
    title: n === 1 ? 'Premier Jour Parfait' : `Jour Parfait × ${n}`,
    description: `Valide tes 6 habitudes le même jour, ${n} fois au total.`,
  }));
}

export function getAllAchievements(): Achievement[] {
  return [...getHabitAchievements(), ...getPerfectDayAchievements()];
}

// ─── Succès maître : débloqué quand TOUS les autres succès sont complétés ────
export const MASTER_ACHIEVEMENT: Achievement = {
  id: 'aegis_master',
  habitKey: 'master',
  threshold: 0, // calculé spécialement (voir useHabitAchievements), pas via un seuil simple
  title: 'AEGIS',
  description: 'Obtiens tous les autres succès.',
};

// ─── Vérifie si un jour est "parfait" (les 6 habitudes validées) ─────────────
export function isPerfectDay(day: DailyLog): boolean {
  return HABIT_KEYS.every(k => !!day[k]);
}
