// ══════════════════════════════════════════════
// AEGIS — Système RPG
// ══════════════════════════════════════════════

// ─── RANGS ───────────────────────────────────
export type Rank = {
  level: number;
  name: string;
  minXP: number;
  maxXP: number;
  color: string;
  aura: string;
};

export const RANKS: Rank[] = [
  { level: 1,  name: 'NOVICE',       minXP: 0,    maxXP: 100,   color: '#6B6B6B', aura: '#6B6B6B22' },
  { level: 2,  name: 'INITIÉ',       minXP: 100,  maxXP: 250,   color: '#8B7355', aura: '#8B735522' },
  { level: 3,  name: 'DISCIPLE',     minXP: 250,  maxXP: 500,   color: '#A0896E', aura: '#A0896E22' },
  { level: 4,  name: 'GUERRIER',     minXP: 500,  maxXP: 900,   color: '#C9A84C', aura: '#C9A84C22' },
  { level: 5,  name: 'STRATÈGE',     minXP: 900,  maxXP: 1400,  color: '#C9A84C', aura: '#C9A84C33' },
  { level: 6,  name: 'CONQUÉRANT',   minXP: 1400, maxXP: 2000,  color: '#E8C46A', aura: '#E8C46A33' },
  { level: 7,  name: 'CHAMPION',     minXP: 2000, maxXP: 2800,  color: '#E8C46A', aura: '#E8C46A44' },
  { level: 8,  name: 'MAÎTRE',       minXP: 2800, maxXP: 3800,  color: '#F0D080', aura: '#F0D08044' },
  { level: 9,  name: 'ÉLITE',        minXP: 3800, maxXP: 5000,  color: '#F5E090', aura: '#F5E09055' },
  { level: 10, name: 'AEGIS',        minXP: 5000, maxXP: 99999, color: '#FFFFFF', aura: '#FFFFFF55' },
];

export function getRank(totalXP: number): Rank {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (totalXP >= RANKS[i].minXP) return RANKS[i];
  }
  return RANKS[0];
}

export function getXPProgress(totalXP: number): number {
  const rank = getRank(totalXP);
  const progress = totalXP - rank.minXP;
  const needed = rank.maxXP - rank.minXP;
  return Math.min(progress / needed, 1);
}

export function getXPNeeded(totalXP: number): number {
  const rank = getRank(totalXP);
  return rank.maxXP - totalXP;
}

// ─── XP PAR ACTION ───────────────────────────
export const XP_REWARDS = {
  workout_done:   40,
  calories_ok:    20,
  learning_done:  25,
  m_face:         15,
  outfit_ok:      10,
  morning_water:  10,
  journal:        15,
  focus:          10,
  // Bonus streak
  streak_7:       100,
  streak_30:      500,
  streak_100:     2000,
};

export function calcDayXP(day: any): number {
  let xp = 0;
  if (day.workout_done)  xp += XP_REWARDS.workout_done;
  if (day.calories_ok)   xp += XP_REWARDS.calories_ok;
  if (day.learning_done) xp += XP_REWARDS.learning_done;
  if (day.m_face)        xp += XP_REWARDS.m_face;
  if (day.outfit_ok)     xp += XP_REWARDS.outfit_ok;
  if (day.morning_water) xp += XP_REWARDS.morning_water;
  if (day.journal?.trim()) xp += XP_REWARDS.journal;
  if (day.focus?.trim())   xp += XP_REWARDS.focus;
  return xp;
}

export function calcTotalXP(history: any[]): number {
  return history.reduce((acc, day) => acc + calcDayXP(day), 0);
}

// ─── CITATIONS ──────────────────────────────
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

// ─── MILESTONES STREAK ────────────────────────
export type Milestone = {
  days: number;
  title: string;
  description: string;
  color: string;
  emoji: string;
};

export const STREAK_MILESTONES: Milestone[] = [
  { days: 3,   title: 'PREMIER FEUX',    description: '3 jours de discipline', color: '#C9A84C', emoji: '🔥' },
  { days: 7,   title: 'UNE SEMAINE',     description: 'La première semaine est derrière toi', color: '#C9A84C', emoji: '⚡' },
  { days: 14,  title: 'FORTERESSE',      description: '2 semaines sans faillir', color: '#E8C46A', emoji: '🏰' },
  { days: 21,  title: 'HABITUDE FORGÉE', description: "21 jours — c'est désormais une habitude", color: '#E8C46A', emoji: '⚔️' },
  { days: 30,  title: 'MOIS DE FEU',     description: 'Un mois complet de discipline', color: '#F0D080', emoji: '👑' },
  { days: 60,  title: 'DEUX MOIS',       description: 'La transformation est visible', color: '#F0D080', emoji: '💎' },
  { days: 100, title: 'CENTURION',       description: '100 jours — tu es dans le 1%', color: '#FFFFFF', emoji: '🏆' },
  { days: 365, title: 'LÉGENDAIRE',      description: 'Une année entière. Rien ne t\'arrête.', color: '#FFFFFF', emoji: '🌟' },
];

export function getCurrentMilestone(streak: number): Milestone | null {
  const achieved = STREAK_MILESTONES.filter(m => streak >= m.days);
  return achieved.length > 0 ? achieved[achieved.length - 1] : null;
}

export function getNextMilestone(streak: number): Milestone | null {
  return STREAK_MILESTONES.find(m => streak < m.days) ?? null;
}

// ─── RÉVÉLATION D'ARCHÉTYPE ──────────────────
// Analyse les 21 derniers jours et révèle l'archétype dominant
export function revealArchetype(history: any[]): string {
  const last21 = history
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 21);

  if (last21.length < 3) return 'conquerant'; // Pas assez de données

  // Score par archétype sur les 21 jours
  const scores: Record<string, number> = {
    titan: 0,
    stratege: 0,
    ombre: 0,
    visionnaire: 0,
    conquerant: 0,
  };

  last21.forEach((day: any) => {
    // TITAN → sport + cardio dominant
    if (day.workout_done) scores.titan += 3;
    if ((day.cardio_min ?? 0) > 20) scores.titan += 2;

    // STRATÈGE → lecture + focus + journal
    if (day.learning_done) scores.stratege += 3;
    if (day.focus?.trim()) scores.stratege += 2;
    if (day.journal?.trim()) scores.stratege += 1;

    // OMBRE → skincare + style + discipline silencieuse
    if (day.m_face) scores.ombre += 2;
    if (day.outfit_ok) scores.ombre += 2;
    if (day.morning_water && day.m_face && day.outfit_ok) scores.ombre += 2; // tout fait discrètement

    // VISIONNAIRE → objectifs + vision + tout équilibré
    if (day.daily_goal?.trim()) scores.visionnaire += 2;
    const habitCount = [day.workout_done, day.calories_ok, day.learning_done, day.m_face, day.outfit_ok, day.morning_water].filter(Boolean).length;
    if (habitCount >= 5) scores.visionnaire += 2; // équilibre

    // CONQUÉRANT → tout coché, calories respectées, séance
    if (day.workout_done && day.calories_ok) scores.conquerant += 3;
    if (habitCount === 6) scores.conquerant += 3;
  });

  // Trouve le dominant
  const winner = Object.entries(scores).reduce((a, b) => a[1] > b[1] ? a : b);

  // Vérifie que le gagnant domine vraiment (au moins 20% d'écart)
  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  if (total === 0) return 'conquerant';

  const dominance = winner[1] / total;
  if (dominance < 0.25) return 'conquerant'; // Pas assez dominant → Conquérant par défaut

  return winner[0];
}
