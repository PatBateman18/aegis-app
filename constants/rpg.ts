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
  { level:   1, name: 'NOVICE', minXP:      0, maxXP:     211, color: '#6B6B6B', aura: '#6B6B6B22' },
  { level:   2, name: 'NOVICE', minXP:    211, maxXP:     422, color: '#6B6B6B', aura: '#6B6B6B22' },
  { level:   3, name: 'NOVICE', minXP:    422, maxXP:     633, color: '#6B6B6B', aura: '#6B6B6B22' },
  { level:   4, name: 'NOVICE', minXP:    633, maxXP:     844, color: '#6B6B6B', aura: '#6B6B6B22' },
  { level:   5, name: 'NOVICE', minXP:    844, maxXP:    1055, color: '#6B6B6B', aura: '#6B6B6B22' },
  { level:   6, name: 'NOVICE', minXP:   1055, maxXP:    1266, color: '#6B6B6B', aura: '#6B6B6B22' },
  { level:   7, name: 'NOVICE', minXP:   1266, maxXP:    1477, color: '#6B6B6B', aura: '#6B6B6B22' },
  { level:   8, name: 'NOVICE', minXP:   1477, maxXP:    1688, color: '#6B6B6B', aura: '#6B6B6B22' },
  { level:   9, name: 'NOVICE', minXP:   1688, maxXP:    1899, color: '#6B6B6B', aura: '#6B6B6B22' },
  { level:  10, name: 'NOVICE', minXP:   1899, maxXP:    2110, color: '#6B6B6B', aura: '#6B6B6B22' },
  { level:  11, name: 'INITIÉ', minXP:   2110, maxXP:    2427, color: '#8B7355', aura: '#8B735522' },
  { level:  12, name: 'INITIÉ', minXP:   2427, maxXP:    2744, color: '#8B7355', aura: '#8B735522' },
  { level:  13, name: 'INITIÉ', minXP:   2744, maxXP:    3061, color: '#8B7355', aura: '#8B735522' },
  { level:  14, name: 'INITIÉ', minXP:   3061, maxXP:    3378, color: '#8B7355', aura: '#8B735522' },
  { level:  15, name: 'INITIÉ', minXP:   3378, maxXP:    3695, color: '#8B7355', aura: '#8B735522' },
  { level:  16, name: 'INITIÉ', minXP:   3695, maxXP:    4012, color: '#8B7355', aura: '#8B735522' },
  { level:  17, name: 'INITIÉ', minXP:   4012, maxXP:    4329, color: '#8B7355', aura: '#8B735522' },
  { level:  18, name: 'INITIÉ', minXP:   4329, maxXP:    4646, color: '#8B7355', aura: '#8B735522' },
  { level:  19, name: 'INITIÉ', minXP:   4646, maxXP:    4963, color: '#8B7355', aura: '#8B735522' },
  { level:  20, name: 'INITIÉ', minXP:   4963, maxXP:    5280, color: '#8B7355', aura: '#8B735522' },
  { level:  21, name: 'DISCIPLE', minXP:   5280, maxXP:    5703, color: '#A0896E', aura: '#A0896E22' },
  { level:  22, name: 'DISCIPLE', minXP:   5703, maxXP:    6126, color: '#A0896E', aura: '#A0896E22' },
  { level:  23, name: 'DISCIPLE', minXP:   6126, maxXP:    6549, color: '#A0896E', aura: '#A0896E22' },
  { level:  24, name: 'DISCIPLE', minXP:   6549, maxXP:    6972, color: '#A0896E', aura: '#A0896E22' },
  { level:  25, name: 'DISCIPLE', minXP:   6972, maxXP:    7395, color: '#A0896E', aura: '#A0896E22' },
  { level:  26, name: 'DISCIPLE', minXP:   7395, maxXP:    7818, color: '#A0896E', aura: '#A0896E22' },
  { level:  27, name: 'DISCIPLE', minXP:   7818, maxXP:    8241, color: '#A0896E', aura: '#A0896E22' },
  { level:  28, name: 'DISCIPLE', minXP:   8241, maxXP:    8664, color: '#A0896E', aura: '#A0896E22' },
  { level:  29, name: 'DISCIPLE', minXP:   8664, maxXP:    9087, color: '#A0896E', aura: '#A0896E22' },
  { level:  30, name: 'DISCIPLE', minXP:   9087, maxXP:    9510, color: '#A0896E', aura: '#A0896E22' },
  { level:  31, name: 'GUERRIER', minXP:   9510, maxXP:   10039, color: '#C9A84C', aura: '#C9A84C22' },
  { level:  32, name: 'GUERRIER', minXP:  10039, maxXP:   10568, color: '#C9A84C', aura: '#C9A84C22' },
  { level:  33, name: 'GUERRIER', minXP:  10568, maxXP:   11097, color: '#C9A84C', aura: '#C9A84C22' },
  { level:  34, name: 'GUERRIER', minXP:  11097, maxXP:   11626, color: '#C9A84C', aura: '#C9A84C22' },
  { level:  35, name: 'GUERRIER', minXP:  11626, maxXP:   12155, color: '#C9A84C', aura: '#C9A84C22' },
  { level:  36, name: 'GUERRIER', minXP:  12155, maxXP:   12684, color: '#C9A84C', aura: '#C9A84C22' },
  { level:  37, name: 'GUERRIER', minXP:  12684, maxXP:   13213, color: '#C9A84C', aura: '#C9A84C22' },
  { level:  38, name: 'GUERRIER', minXP:  13213, maxXP:   13742, color: '#C9A84C', aura: '#C9A84C22' },
  { level:  39, name: 'GUERRIER', minXP:  13742, maxXP:   14271, color: '#C9A84C', aura: '#C9A84C22' },
  { level:  40, name: 'GUERRIER', minXP:  14271, maxXP:   14800, color: '#C9A84C', aura: '#C9A84C22' },
  { level:  41, name: 'STRATÈGE', minXP:  14800, maxXP:   15435, color: '#E8C46A', aura: '#E8C46A33' },
  { level:  42, name: 'STRATÈGE', minXP:  15435, maxXP:   16070, color: '#E8C46A', aura: '#E8C46A33' },
  { level:  43, name: 'STRATÈGE', minXP:  16070, maxXP:   16705, color: '#E8C46A', aura: '#E8C46A33' },
  { level:  44, name: 'STRATÈGE', minXP:  16705, maxXP:   17340, color: '#E8C46A', aura: '#E8C46A33' },
  { level:  45, name: 'STRATÈGE', minXP:  17340, maxXP:   17975, color: '#E8C46A', aura: '#E8C46A33' },
  { level:  46, name: 'STRATÈGE', minXP:  17975, maxXP:   18610, color: '#E8C46A', aura: '#E8C46A33' },
  { level:  47, name: 'STRATÈGE', minXP:  18610, maxXP:   19245, color: '#E8C46A', aura: '#E8C46A33' },
  { level:  48, name: 'STRATÈGE', minXP:  19245, maxXP:   19880, color: '#E8C46A', aura: '#E8C46A33' },
  { level:  49, name: 'STRATÈGE', minXP:  19880, maxXP:   20515, color: '#E8C46A', aura: '#E8C46A33' },
  { level:  50, name: 'STRATÈGE', minXP:  20515, maxXP:   21150, color: '#E8C46A', aura: '#E8C46A33' },
  { level:  51, name: 'CONQUÉRANT', minXP:  21150, maxXP:   21838, color: '#F0D080', aura: '#F0D08044' },
  { level:  52, name: 'CONQUÉRANT', minXP:  21838, maxXP:   22526, color: '#F0D080', aura: '#F0D08044' },
  { level:  53, name: 'CONQUÉRANT', minXP:  22526, maxXP:   23214, color: '#F0D080', aura: '#F0D08044' },
  { level:  54, name: 'CONQUÉRANT', minXP:  23214, maxXP:   23902, color: '#F0D080', aura: '#F0D08044' },
  { level:  55, name: 'CONQUÉRANT', minXP:  23902, maxXP:   24590, color: '#F0D080', aura: '#F0D08044' },
  { level:  56, name: 'CONQUÉRANT', minXP:  24590, maxXP:   25278, color: '#F0D080', aura: '#F0D08044' },
  { level:  57, name: 'CONQUÉRANT', minXP:  25278, maxXP:   25966, color: '#F0D080', aura: '#F0D08044' },
  { level:  58, name: 'CONQUÉRANT', minXP:  25966, maxXP:   26654, color: '#F0D080', aura: '#F0D08044' },
  { level:  59, name: 'CONQUÉRANT', minXP:  26654, maxXP:   27342, color: '#F0D080', aura: '#F0D08044' },
  { level:  60, name: 'CONQUÉRANT', minXP:  27342, maxXP:   28030, color: '#F0D080', aura: '#F0D08044' },
  { level:  61, name: 'CHAMPION', minXP:  28030, maxXP:   28771, color: '#F5E090', aura: '#F5E09044' },
  { level:  62, name: 'CHAMPION', minXP:  28771, maxXP:   29512, color: '#F5E090', aura: '#F5E09044' },
  { level:  63, name: 'CHAMPION', minXP:  29512, maxXP:   30253, color: '#F5E090', aura: '#F5E09044' },
  { level:  64, name: 'CHAMPION', minXP:  30253, maxXP:   30994, color: '#F5E090', aura: '#F5E09044' },
  { level:  65, name: 'CHAMPION', minXP:  30994, maxXP:   31735, color: '#F5E090', aura: '#F5E09044' },
  { level:  66, name: 'CHAMPION', minXP:  31735, maxXP:   32476, color: '#F5E090', aura: '#F5E09044' },
  { level:  67, name: 'CHAMPION', minXP:  32476, maxXP:   33217, color: '#F5E090', aura: '#F5E09044' },
  { level:  68, name: 'CHAMPION', minXP:  33217, maxXP:   33958, color: '#F5E090', aura: '#F5E09044' },
  { level:  69, name: 'CHAMPION', minXP:  33958, maxXP:   34699, color: '#F5E090', aura: '#F5E09044' },
  { level:  70, name: 'CHAMPION', minXP:  34699, maxXP:   35440, color: '#F5E090', aura: '#F5E09044' },
  { level:  71, name: 'MAÎTRE', minXP:  35440, maxXP:   36128, color: '#FFF0AA', aura: '#FFF0AA55' },
  { level:  72, name: 'MAÎTRE', minXP:  36128, maxXP:   36816, color: '#FFF0AA', aura: '#FFF0AA55' },
  { level:  73, name: 'MAÎTRE', minXP:  36816, maxXP:   37504, color: '#FFF0AA', aura: '#FFF0AA55' },
  { level:  74, name: 'MAÎTRE', minXP:  37504, maxXP:   38192, color: '#FFF0AA', aura: '#FFF0AA55' },
  { level:  75, name: 'MAÎTRE', minXP:  38192, maxXP:   38880, color: '#FFF0AA', aura: '#FFF0AA55' },
  { level:  76, name: 'MAÎTRE', minXP:  38880, maxXP:   39568, color: '#FFF0AA', aura: '#FFF0AA55' },
  { level:  77, name: 'MAÎTRE', minXP:  39568, maxXP:   40256, color: '#FFF0AA', aura: '#FFF0AA55' },
  { level:  78, name: 'MAÎTRE', minXP:  40256, maxXP:   40944, color: '#FFF0AA', aura: '#FFF0AA55' },
  { level:  79, name: 'MAÎTRE', minXP:  40944, maxXP:   41632, color: '#FFF0AA', aura: '#FFF0AA55' },
  { level:  80, name: 'MAÎTRE', minXP:  41632, maxXP:   42320, color: '#FFF0AA', aura: '#FFF0AA55' },
  { level:  81, name: 'ÉLITE', minXP:  42320, maxXP:   42710, color: '#FFFFFF', aura: '#FFFFFF55' },
  { level:  82, name: 'ÉLITE', minXP:  42710, maxXP:   43100, color: '#FFFFFF', aura: '#FFFFFF55' },
  { level:  83, name: 'ÉLITE', minXP:  43100, maxXP:   43490, color: '#FFFFFF', aura: '#FFFFFF55' },
  { level:  84, name: 'ÉLITE', minXP:  43490, maxXP:   43880, color: '#FFFFFF', aura: '#FFFFFF55' },
  { level:  85, name: 'ÉLITE', minXP:  43880, maxXP:   44270, color: '#FFFFFF', aura: '#FFFFFF55' },
  { level:  86, name: 'ÉLITE', minXP:  44270, maxXP:   44660, color: '#FFFFFF', aura: '#FFFFFF55' },
  { level:  87, name: 'ÉLITE', minXP:  44660, maxXP:   45050, color: '#FFFFFF', aura: '#FFFFFF55' },
  { level:  88, name: 'ÉLITE', minXP:  45050, maxXP:   45440, color: '#FFFFFF', aura: '#FFFFFF55' },
  { level:  89, name: 'ÉLITE', minXP:  45440, maxXP:   45830, color: '#FFFFFF', aura: '#FFFFFF55' },
  { level:  90, name: 'ÉLITE', minXP:  45830, maxXP:   46220, color: '#FFFFFF', aura: '#FFFFFF55' },
  { level:  91, name: 'ÉLITE', minXP:  46220, maxXP:   46610, color: '#FFFFFF', aura: '#FFFFFF55' },
  { level:  92, name: 'ÉLITE', minXP:  46610, maxXP:   47000, color: '#FFFFFF', aura: '#FFFFFF55' },
  { level:  93, name: 'ÉLITE', minXP:  47000, maxXP:   47390, color: '#FFFFFF', aura: '#FFFFFF55' },
  { level:  94, name: 'ÉLITE', minXP:  47390, maxXP:   47780, color: '#FFFFFF', aura: '#FFFFFF55' },
  { level:  95, name: 'ÉLITE', minXP:  47780, maxXP:   48170, color: '#FFFFFF', aura: '#FFFFFF55' },
  { level:  96, name: 'ÉLITE', minXP:  48170, maxXP:   48560, color: '#FFFFFF', aura: '#FFFFFF55' },
  { level:  97, name: 'ÉLITE', minXP:  48560, maxXP:   48950, color: '#FFFFFF', aura: '#FFFFFF55' },
  { level:  98, name: 'ÉLITE', minXP:  48950, maxXP:   49340, color: '#FFFFFF', aura: '#FFFFFF55' },
  { level:  99, name: 'ÉLITE', minXP:  49340, maxXP:   49730, color: '#FFFFFF', aura: '#FFFFFF55' },
  { level: 100, name: 'AEGIS', minXP:  49730, maxXP:  999999, color: '#FFFFFF', aura: '#FFFFFF77' },
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
  if (rank.level >= 100) return 0;
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
  { days: 3,   title: 'PREMIER FEUX',    description: '3 jours de discipline', color: '#C9A84C', emoji: '⚡' },
  { days: 7,   title: 'UNE SEMAINE',     description: 'La première semaine est derrière toi', color: '#C9A84C', emoji: '⚡' },
  { days: 14,  title: 'FORTERESSE',      description: '2 semaines sans faillir', color: '#E8C46A', emoji: '✦' },
  { days: 21,  title: 'HABITUDE FORGÉE', description: "21 jours — c'est désormais une habitude", color: '#E8C46A', emoji: '⚔' },
  { days: 30,  title: 'MOIS DE FEU',     description: 'Un mois complet de discipline', color: '#F0D080', emoji: '◆' },
  { days: 60,  title: 'DEUX MOIS',       description: 'La transformation est visible', color: '#F0D080', emoji: '◈' },
  { days: 100, title: 'CENTURION',       description: '100 jours — tu es dans le 1%', color: '#FFFFFF', emoji: '▲' },
  { days: 365, title: 'LÉGENDAIRE',      description: 'Une année entière. Rien ne t\'arrête.', color: '#FFFFFF', emoji: '✦' },
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
