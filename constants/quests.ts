// constants/quests.ts
import { DailyLog } from './types';

export type Quest = {
  id: string;
  title: string;
  titleFemale?: string;
  description: string;
  xp: number;
  phrase: string;
  phraseFemale?: string;
  icon: string;
  color: string;
  check: (day: DailyLog) => boolean;
  fixed?: boolean;
};

/** Retourne une version de la quête adaptée au genre ('female' ou autre) */
export function adaptQuest(quest: Quest, gender: string): Quest {
  if (gender !== 'female') return quest;
  return {
    ...quest,
    title: quest.titleFemale ?? quest.title,
    phrase: quest.phraseFemale ?? quest.phrase,
  };
}

/** Adapte un tableau de quêtes au genre */
export function adaptQuestsForGender(quests: Quest[], gender: string): Quest[] {
  return quests.map(q => adaptQuest(q, gender));
}

// ─── Quête fixe (or) ──────────────────────────────────────────────────────────
export const FIXED_QUEST: Quest = {
  id: 'forge_du_jour',
  title: 'Forge du Jour',
  description: 'Valide les 6 habitudes avant 21h',
  xp: 50,
  phrase: "Journée parfaite. L'empire se construit ainsi.",
  icon: '◆',
  color: '#C9A84C',
  fixed: true,
  check: (day) => {
    const hour = new Date().getHours();
    const allDone = !!(day.workout_done && day.calories_ok && day.learning_done && day.m_face && day.outfit_ok && day.morning_water);
    return allDone && hour < 21;
  },
};

// ─── Pool — couleur unique par quête ─────────────────────────────────────────
export const QUEST_POOL: Quest[] = [
  {
    id: 'guerrier_matin',
    title: 'Guerrier du Matin',
    titleFemale: 'Guerrière du Matin',
    description: 'Valide 3 habitudes avant midi',
    xp: 30,
    phrase: "Le matin gagné, c'est la journée gagnée.",
    icon: '▲',
    color: '#D94F4F',   // rouge
    check: (day) => {
      const hour = new Date().getHours();
      const done = [day.workout_done, day.calories_ok, day.learning_done, day.m_face, day.outfit_ok, day.morning_water].filter(Boolean).length;
      return done >= 3 && hour < 12;
    },
  },
  {
    id: 'corps_esprit',
    title: 'Corps & Esprit',
    description: 'Séance + Lecture complétées',
    xp: 35,
    phrase: "Le corps et l'esprit forgés ensemble.",
    icon: '◈',
    color: '#52C97A',   // vert
    check: (day) => !!(day.workout_done && day.learning_done),
  },
  {
    id: 'discipline_totale',
    title: 'Discipline Totale',
    description: 'Calories + Séance + Eau au réveil',
    xp: 40,
    phrase: 'Trois piliers. Un seul standard.',
    icon: 'Λ',
    color: '#3AAFA9',   // turquoise
    check: (day) => !!(day.calories_ok && day.workout_done && day.morning_water),
  },
  {
    id: 'style_spartiate',
    title: 'Style Spartiate',
    description: 'Skincare complet + Tenue soignée',
    xp: 25,
    phrase: "L'apparence est le respect que tu te portes.",
    icon: '✦',
    color: '#F472B6',   // rose/magenta
    check: (day) => !!(day.m_face && day.outfit_ok),
  },
  {
    id: 'mental_acier',
    title: "Mental d'Acier",
    description: 'Lecture + Objectif du jour rempli',
    xp: 30,
    phrase: "L'esprit affûté avant la bataille.",
    icon: '○',
    color: '#A855F7',   // violet
    check: (day) => !!(day.learning_done && day.daily_goal?.trim()),
  },
  {
    id: 'hydratation_roi',
    title: 'Hydratation Royale',
    description: 'Eau au réveil + Calories respectées',
    xp: 25,
    phrase: 'Le corps nourri, la discipline suit.',
    icon: '◇',
    color: '#38BDF8',   // bleu ciel
    check: (day) => !!(day.morning_water && day.calories_ok),
  },
  {
    id: 'rituel_complet',
    title: 'Rituel Complet',
    description: 'Toute la routine skincare matin ET soir',
    xp: 35,
    phrase: "Le rituel quotidien forge l'identité.",
    icon: '◉',
    color: '#FB923C',   // orange
    check: (day) => !!(day.m_face && day.m_hydra && day.e_face && day.e_hydra),
  },
  {
    id: 'conquete_physique',
    title: 'Conquête Physique',
    description: 'Séance + Tenue soignée + Calories',
    xp: 45,
    phrase: 'Corps, discipline, présentation. Tout en un.',
    icon: '⊕',
    color: '#EF4444',   // rouge vif
    check: (day) => !!(day.workout_done && day.outfit_ok && day.calories_ok),
  },
];

// ─── Quête du retour — allégée, remplace tout le set le jour d'un comeback ────
// Volontairement seule (pas 3 quêtes) et accessible en une seule habitude :
// l'objectif du jour de retour est de recréer l'élan, pas de tester la
// discipline. Voir la discussion Rétention : "objectif allégé le jour du
// retour pour recréer l'élan".
export const RETURN_QUEST: Quest = {
  id: 'retour_du_heros',
  title: 'Retour du Héros',
  titleFemale: 'Retour de l\'Héroïne',
  description: "Valide une seule habitude aujourd'hui",
  xp: 40,
  phrase: 'Un pas suffit pour reprendre la route.',
  phraseFemale: 'Un pas suffit pour reprendre la route.',
  icon: '✧',
  color: '#C9A84C',
  check: (day) => {
    const done = [day.workout_done, day.calories_ok, day.learning_done, day.m_face, day.outfit_ok, day.morning_water]
      .filter(Boolean).length;
    return done >= 1;
  },
};

// ─── Sélection des 2 quêtes aléatoires du jour ────────────────────────────────
export function getDailyQuests(): Quest[] {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();

  const rand1 = seed % QUEST_POOL.length;
  const rand2 = (seed * 31 + 7) % QUEST_POOL.length;
  const idx2  = rand2 === rand1 ? (rand2 + 1) % QUEST_POOL.length : rand2;

  return [QUEST_POOL[rand1], QUEST_POOL[idx2]];
}

// isReturning : true le jour où l'utilisateur revient après une absence
// (voir useInactivity). Dans ce cas, on remplace tout le set — y compris la
// quête fixe qui demande les 6 habitudes — par une seule quête accessible.
export function getTodayQuests(isReturning: boolean = false): Quest[] {
  if (isReturning) return [RETURN_QUEST];
  return [FIXED_QUEST, ...getDailyQuests()];
}
