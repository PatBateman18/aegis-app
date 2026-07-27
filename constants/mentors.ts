// constants/mentors.ts
export type MentorId =
  // Hommes
  | 'krios' | 'hermes' | 'achille' | 'ulysse' | 'leonidas' | 'alexandre'
  // Femmes
  | 'aspasia' | 'penelope' | 'athena' | 'artemis' | 'hera' | 'aphrodite';

export type Mentor = {
  id: MentorId;
  name: string;
  gender: 'male' | 'female';
  premium: boolean;
  portrait: any | null;   // any = portrait généré ; null = pas encore généré → placeholder SVG
  tagline: string;
  traits: string;         // ex: "Discipline • Force • Loyauté"
  unlockHint?: string;    // ⚠️ conditions à définir — placeholders pour l'instant
};

export const MENTORS: Mentor[] = [
  // ─── HOMMES ────────────────────────────────────────────────────────────────
  {
    id: 'krios',
    name: 'KRIOS',
    gender: 'male',
    premium: false,
    portrait: require('@/assets/mentors/mentor_krios.png'),
    tagline: 'Le guide originel — discipline et conquête.',
    traits: 'Discipline • Force • Loyauté',
  },
  {
    id: 'hermes',
    name: 'HERMÈS',
    gender: 'male',
    premium: false,
    portrait: require('@/assets/mentors/mentor_hermes.png'),
    tagline: 'Messager rapide, malicieux, toujours en mouvement.',
    traits: 'Agilité • Ruse • Adaptabilité',
  },
  {
    id: 'achille',
    name: 'ACHILLE',
    gender: 'male',
    premium: true,
    portrait: require('@/assets/mentors/mentor_achille.png'),
    tagline: 'La fureur du héros — intensité sans compromis.',
    traits: 'Intensité • Bravoure • Gloire',
    unlockHint: 'Condition à définir',
  },
  {
    id: 'ulysse',
    name: 'ULYSSE',
    gender: 'male',
    premium: true,
    portrait: require('@/assets/mentors/mentor_ulysse.png'),
    tagline: "L'ingéniosité au service du retour — jamais perdu, toujours en route.",
    traits: 'Stratégie • Ruse • Patience',
    unlockHint: 'Condition à définir',
  },
  {
    id: 'leonidas',
    name: 'LÉONIDAS',
    gender: 'male',
    premium: true,
    portrait: require('@/assets/mentors/mentor_leonidas.png'),
    tagline: 'Tenir la ligne, quoi qu\'il en coûte.',
    traits: 'Courage • Détermination • Sacrifice',
    unlockHint: 'Condition à définir',
  },
  {
    id: 'alexandre',
    name: 'ALEXANDRE',
    gender: 'male',
    premium: true,
    portrait: require('@/assets/mentors/mentor_alexandre.png'),
    tagline: 'Repousser chaque limite, une conquête après l\'autre.',
    traits: 'Ambition • Vision • Gloire',
    unlockHint: 'Condition à définir',
  },

  // ─── FEMMES ────────────────────────────────────────────────────────────────
  {
    id: 'aspasia',
    name: 'ASPASIA',
    gender: 'female',
    premium: false,
    portrait: require('@/assets/mentors/mentor_aspasia.png'),
    tagline: 'La guide originelle — sagesse et constance.',
    traits: 'Sagesse • Équilibre • Bienveillance',
  },
  {
    id: 'penelope',
    name: 'PÉNÉLOPE',
    gender: 'female',
    premium: false,
    portrait: require('@/assets/mentors/mentor_penelope.png'),
    tagline: 'La patience infinie — vingt ans à tisser, jamais renoncé.',
    traits: 'Patience • Loyauté • Constance',
  },
  {
    id: 'athena',
    name: 'ATHÉNA',
    gender: 'female',
    premium: true,
    portrait: require('@/assets/mentors/mentor_athena.png'),
    tagline: 'La stratégie avant la force — penser, puis frapper juste.',
    traits: 'Stratégie • Clarté • Maîtrise',
    unlockHint: 'Condition à définir',
  },
  {
    id: 'artemis',
    name: 'ARTÉMIS',
    gender: 'female',
    premium: true,
    portrait: require('@/assets/mentors/mentor_artemis.png'),
    tagline: 'L\'indépendance farouche — ta route, tes règles.',
    traits: 'Autonomie • Précision • Liberté',
    unlockHint: 'Condition à définir',
  },
  {
    id: 'hera',
    name: 'HÉRA',
    gender: 'female',
    premium: true,
    portrait: require('@/assets/mentors/mentor_hera.png'),
    tagline: 'La souveraineté sur soi — tenir son rang, toujours.',
    traits: 'Autorité • Dignité • Exigence',
    unlockHint: 'Condition à définir',
  },
  {
    id: 'aphrodite',
    name: 'APHRODITE',
    gender: 'female',
    premium: true,
    portrait: require('@/assets/mentors/mentor_aphrodite.png'),
    tagline: 'Le respect de soi — l\'apparence comme reflet de l\'estime.',
    traits: 'Confiance • Éclat • Estime de soi',
    unlockHint: 'Condition à définir',
  },
];

export function getMentor(id: MentorId | null | undefined): Mentor {
  return MENTORS.find(m => m.id === id) ?? MENTORS[0];
}

export function defaultMentorForGender(gender: string): MentorId {
  return gender === 'female' ? 'aspasia' : 'krios';
}
