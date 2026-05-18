export const QUOTES = [
  "L'empire se construit dans l'obscurité. La gloire vient après.",
  "Chaque jour non exploité est une défaite que tu t'infliges.",
  "Discipline maintenant. Liberté demain.",
  "Ton futur moi te regarde. Que voit-il aujourd'hui ?",
  "Les faibles attendent l'inspiration. Les forts créent la routine.",
  "Alexandre ne demandait pas si c'était possible — il demandait comment.",
  "Pas d'excuses. Pas de regrets. Seulement l'action.",
  "Le corps obéit à l'esprit. Entraîne les deux.",
  "Bâtis aujourd'hui l'homme que tu veux être demain.",
  "La douleur d'aujourd'hui forge la force de demain.",
  "Un seul jour perdu, c'est un avantage offert à l'adversaire.",
  "L'excellence n'est pas un acte — c'est une habitude.",
  "Ce que tu fais quand personne ne regarde, c'est qui tu es vraiment.",
];

export const WORKOUT_TYPES = [
  'Pecs / Épaules',
  'Dos / Biceps / Triceps',
  'Jambes',
  'Full Body',
  'Cardio',
  'Bras',
  'Autre',
];

export type DailyLog = {
  id?: string;
  user_id?: string;
  date: string;
  calories?: number;
  protein?: number;
  weight?: number;
  cardio_min?: number;
  workout_done: boolean;
  workout_type?: string;
  calories_ok: boolean;
  learning_done: boolean;
  morning_water: boolean;
  outfit_ok: boolean;
  m_face: boolean;
  m_hydra: boolean;
  m_skin: boolean;
  e_face: boolean;
  e_hydra: boolean;
  e_skin: boolean;
  focus?: string;
  journal?: string;
  daily_goal?: string;
  style_notes?: string;
};

export type Goals = {
  vision?: string;
  physical_goal?: string;
  mental_goal?: string;
  style_goal?: string;
  timeline?: string;
  rules?: string;
  last_haircut?: string;
};

export type Profile = {
  id: string;
  name?: string;
  avatar_url?: string;
  cal_target: number;
  prot_target: number;
  onboarding_done?: boolean;
  push_token?: string;
  notif_morning: boolean;
  notif_morning_hour: number;
  notif_morning_minute: number;
  notif_evening: boolean;
  notif_evening_hour: number;
  notif_evening_minute: number;
};

export const HABIT_KEYS: (keyof DailyLog)[] = [
  'workout_done', 'calories_ok', 'learning_done',
  'm_face', 'outfit_ok', 'morning_water',
];

export const HABIT_LABELS: Record<string, string> = {
  workout_done:   'Séance',
  calories_ok:    'Calories',
  learning_done:  'Lecture',
  m_face:         'Skincare',
  outfit_ok:      'Style',
  morning_water:  'Eau',
};

export function calcScore(day: DailyLog): number {
  const done = HABIT_KEYS.filter(k => !!day[k]).length;
  return Math.round((done / HABIT_KEYS.length) * 100);
}

export function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export function mkDay(date: string): DailyLog {
  return {
    date,
    workout_done: false, calories_ok: false, learning_done: false,
    morning_water: false, outfit_ok: false,
    m_face: false, m_hydra: false, m_skin: false,
    e_face: false, e_hydra: false, e_skin: false,
  };
}
