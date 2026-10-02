// constants/medals.ts
// Table partagée des médailles de rang (niveau 1 à 10).
// Extrait du pattern déjà utilisé en dur dans profile.tsx (AEGIS 6) —
// centralisé ici pour être réutilisé ailleurs (ex: PaywallScreen) sans dupliquer les require().
//
// ⚠️ Si tu changes ce fichier, pense à faire pointer profile.tsx vers cet export
// au lieu de garder sa propre table RANK_MEDALS en double (pas fait automatiquement
// ici pour ne pas toucher un fichier qui marche déjà en prod).

export const RANK_MEDALS: Record<number, any> = {
  1: require('@/assets/medals/medaille_rang_01_novice.png'),
  2: require('@/assets/medals/medaille_rang_02_initie.png'),
  3: require('@/assets/medals/medaille_rang_03_disciple.png'),
  4: require('@/assets/medals/medaille_rang_04_guerrier.png'),
  5: require('@/assets/medals/medaille_rang_05_strategie.png'),
  6: require('@/assets/medals/medaille_rang_06_conquerant.png'),
  7: require('@/assets/medals/medaille_rang_07_champion.png'),
  8: require('@/assets/medals/medaille_rang_08_maitre.png'),
  9: require('@/assets/medals/medaille_rang_09_elite.png'),
  10: require('@/assets/medals/medaille_rang_10_aegis.png'),
};

export const RANK_NAMES: Record<number, string> = {
  1: 'Novice',
  2: 'Initié',
  3: 'Disciple',
  4: 'Guerrier',
  5: 'Stratège',
  6: 'Conquérant',
  7: 'Champion',
  8: 'Maître',
  9: 'Élite',
  10: 'AEGIS',
};

export const RANK_MIN_LEVEL = 1;
export const RANK_MAX_LEVEL = 10;
