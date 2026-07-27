import { useState, useEffect } from 'react';
import {
  View, Text, Image, StyleSheet, TouchableOpacity, Modal,
  ScrollView, TextInput, ActivityIndicator, FlatList,
} from 'react-native';
import { C } from '@/constants/colors';

// ─── Accent violet page Corps ─────────────────────────────────────────────────
const ACC  = '#8E44AD';
const ACCB = '#A55CC0';
const ACCD = '#8E44AD33';
// ─────────────────────────────────────────────────────────────────────────────

const MUSCLE_GROUPS = [
  { id: 'chest', label: 'Pectoraux', emoji: '🫁' },
  { id: 'back', label: 'Dos', emoji: '🔙' },
  { id: 'shoulders', label: 'Épaules', emoji: '🏋️' },
  { id: 'upper arms', label: 'Bras', emoji: '💪' },
  { id: 'lower arms', label: 'Avant-bras', emoji: '🦾' },
  { id: 'upper legs', label: 'Cuisses', emoji: '🦵' },
  { id: 'lower legs', label: 'Mollets', emoji: '🦿' },
  { id: 'waist', label: 'Abdos', emoji: '🎯' },
  { id: 'cardio', label: 'Cardio', emoji: '❤️' },
];

type Exercise = {
  id: string;
  name: string;
  bodyPart: string;
  target: string;
  equipment: string;
  gifUrl?: string;        // ← URL du GIF directement dans la réponse API
  difficulty?: string;
  description?: string;
  instructions?: string[];
  secondaryMuscles?: string[];
};



// ─── Mapping GIF local (clés = noms de fichiers réels) ───────────────────────
const GIF_MAP: Record<string, any> = {
  // PECTORAUX
  'chest_001': require('@/assets/exercises/chest_001.gif'),
  'chest_002': require('@/assets/exercises/chest_002.gif'),
  'chest_003': require('@/assets/exercises/chest_003.gif'),
  'chest_004': require('@/assets/exercises/chest_004.gif'),
  'chest_005': require('@/assets/exercises/chest_005.gif'),
  'chest_006': require('@/assets/exercises/chest_006.gif'),
  'chest_007': require('@/assets/exercises/chest_007.gif'),
  // DOS
  'back_001': require('@/assets/exercises/back_001.gif'),
  'back_002': require('@/assets/exercises/back_002.gif'),
  'back_003': require('@/assets/exercises/back_003.gif'),
  'back_004': require('@/assets/exercises/back_004.gif'),
  'back_005': require('@/assets/exercises/back_005.gif'),
  'back_006': require('@/assets/exercises/back_006.gif'),
  // ÉPAULES
  'shoulders_001': require('@/assets/exercises/shoulders_001.gif'),
  'shoulders_002': require('@/assets/exercises/shoulders_002.gif'),
  'shoulders_003': require('@/assets/exercises/shoulders_003.gif'),
  'shoulders_004': require('@/assets/exercises/shoulders_004.gif'),
  // BICEPS
  'biceps_001': require('@/assets/exercises/biceps_001.gif'),
  'biceps_002': require('@/assets/exercises/biceps_002.gif'),
  'biceps_003': require('@/assets/exercises/biceps_003.gif'),
  // TRICEPS
  'triceps_001': require('@/assets/exercises/triceps_001.gif'),
  'triceps_002': require('@/assets/exercises/triceps_002.gif'),
  'triceps_003': require('@/assets/exercises/triceps_003.gif'),
  // JAMBES
  'legs_001': require('@/assets/exercises/legs_001.gif'),
  'legs_002': require('@/assets/exercises/legs_002.gif'),
  'legs_003': require('@/assets/exercises/legs_003.gif'),
  'legs_004': require('@/assets/exercises/legs_004.gif'),
  'legs_005': require('@/assets/exercises/legs_005.gif'),
  // ABDOS
  'abdos_001': require('@/assets/exercises/abdos_001.gif'),
  'abdos_002': require('@/assets/exercises/abdos_002.gif'),
};

// ─── Mapping exercice ID → clé GIF ───────────────────────────────────────────
const EXERCISE_TO_GIF: Record<string, string> = {
  // PECTORAUX
  'o_c1':  'chest_001',   // Développé couché barre
  'o_c2':  'chest_002',   // Développé couché haltères
  'o_c3':  'chest_003',   // Développé incliné barre
  'o_c5':  'chest_004',   // Écarté haltères plat
  'o_c7':  'chest_005',   // Câble croisé haut
  'o_c8':  'chest_005',   // Câble croisé bas (même gif)
  'o_c9':  'chest_006',   // Pec deck machine
  'o_c11': 'chest_007',   // Dips pectoraux
  // DOS
  'o_b1':  'back_001',    // Tractions pronation
  'o_b2':  'back_001',    // Tractions supination
  'o_b3':  'back_002',    // Tirage vertical poulie haute
  'o_b4':  'back_003',    // Rowing barre penché
  'o_b5':  'back_004',    // Rowing haltère 1 bras
  'o_b6':  'back_005',    // Rowing poulie basse
  'o_b8':  'back_006',    // Soulevé de terre
  'o_b9':  'back_006',    // Soulevé de terre roumain (même gif)
  // ÉPAULES
  'o_s1':  'shoulders_001', // Développé militaire barre
  'o_s2':  'shoulders_001', // Développé militaire haltères
  'o_s3':  'shoulders_004', // Développé Arnold
  'o_s4':  'shoulders_002', // Élévations latérales haltères
  'o_s5':  'shoulders_002', // Élévations latérales câble
  'o_s7':  'shoulders_003', // Oiseau haltères
  'o_s8':  'shoulders_003', // Oiseau machine
  // BICEPS
  'o_a6':  'biceps_001',  // Curl pupitre barre EZ
  'o_a3':  'biceps_002',  // Curl haltères alternés
  'o_a4':  'biceps_003',  // Curl marteau
  // TRICEPS
  'o_a13': 'triceps_001', // Dips triceps banc
  'o_a9':  'triceps_002', // Barre au front (skull crusher)
  'o_a10': 'triceps_003', // Pushdown corde
  'o_a11': 'triceps_003', // Extension triceps câble (même gif)
  // JAMBES
  'o_l1':  'legs_001',    // Squat barre
  'o_l2':  'legs_001',    // Squat haltères
  'o_l3':  'legs_002',    // Leg press
  'o_l4':  'legs_003',    // Leg extension
  'o_l9':  'legs_004',    // Leg curl couché
  'o_l10': 'legs_004',    // Leg curl assis
  'o_l8':  'legs_005',    // Hip thrust barre
  'o_l11': 'back_006',    // Soulevé de terre roumain
  // ABDOS
  'o_ab9':  'abdos_001',  // Ab wheel
  'o_ab10': 'abdos_002',  // Crunch câble
};

// ─── Fallback offline — exercices en français par groupe musculaire ───────────
type OfflineExercise = { id: string; name: string; target: string; equipment: string; difficulty?: string; description?: string; instructions?: string[]; secondaryMuscles?: string[]; };
const OFFLINE_EXERCISES: Record<string, OfflineExercise[]> = {
  chest: [
    { id: 'o_c1', name: 'Développé couché barre', target: 'pectoraux', equipment: 'barre', difficulty: 'intermédiaire', description: 'Le développé couché barre est l\'exercice roi pour développer la masse et la force des pectoraux. Il sollicite l\'ensemble du grand pectoral avec un travail important des triceps et deltoïdes antérieurs.', instructions: ['Allongez-vous sur le banc, pieds à plat au sol', 'Saisissez la barre un peu plus large que la largeur des épaules', 'Descendez la barre lentement vers le milieu du pec en inspirant', 'Poussez la barre vers le haut en expirant jusqu\'à l\'extension complète', 'Gardez les coudes à 45° du corps pendant tout le mouvement'], secondaryMuscles: ['triceps', 'deltoïdes antérieurs', 'grand dentelé'] },
    { id: 'o_c2', name: 'Développé couché haltères', target: 'pectoraux', equipment: 'haltères', difficulty: 'intermédiaire', description: 'Version aux haltères du développé couché, offrant une amplitude de mouvement plus grande et un meilleur travail de stabilisation. Idéal pour corriger les déséquilibres entre les deux côtés.', instructions: ['Tenez un haltère dans chaque main, assis au bord du banc', 'Allongez-vous en amenant les haltères au niveau de la poitrine', 'Poussez les haltères vers le haut en les rapprochant légèrement', 'Descendez lentement jusqu\'à sentir l\'étirement des pectoraux', 'Gardez les poignets droits tout au long du mouvement'], secondaryMuscles: ['triceps', 'deltoïdes antérieurs'] },
    { id: 'o_c3', name: 'Développé incliné barre', target: 'pectoraux supérieurs', equipment: 'barre', difficulty: 'intermédiaire', description: 'Le développé incliné cible spécifiquement le haut des pectoraux, zone souvent négligée. Essentiel pour obtenir un pec plein et épais dans sa partie supérieure.', instructions: ['Réglez le banc à 30-45° d\'inclinaison', 'Saisissez la barre légèrement plus large que les épaules', 'Descendez la barre vers le haut de la poitrine (clavicules)', 'Poussez vers le haut en gardant les coudes à 45°', 'Évitez de cambrer excessivement le dos'], secondaryMuscles: ['triceps', 'deltoïdes antérieurs'] },
    { id: 'o_c4', name: 'Développé incliné haltères', target: 'pectoraux supérieurs', equipment: 'haltères', difficulty: 'intermédiaire', description: 'Variante aux haltères du développé incliné. Permet une amplitude plus grande et un meilleur étirement du haut des pectoraux à la phase basse du mouvement.', instructions: ['Banc incliné à 30-45°, haltères en main', 'Amenez les haltères à hauteur des épaules, coudes fléchis', 'Poussez vers le haut et légèrement vers l\'intérieur', 'Descendez lentement en ouvrant les coudes', 'Concentrez-vous sur la contraction du haut des pecs'], secondaryMuscles: ['triceps', 'deltoïdes antérieurs'] },
    { id: 'o_c5', name: 'Écarté haltères plat', target: 'pectoraux', equipment: 'haltères', difficulty: 'débutant', description: 'L\'écarté est un exercice d\'isolation qui étire et contracte les pectoraux sur toute leur largeur. Parfait en fin de séance pour finir les pecs avec une bonne congestion.', instructions: ['Allongé sur banc plat, haltères bras tendus au-dessus de la poitrine', 'Écartez les bras en gardant un léger angle aux coudes', 'Descendez jusqu\'à sentir un étirement profond dans les pectoraux', 'Remontez en arc de cercle en expirant, comme pour enlacer un arbre', 'Ne verrouillez pas les coudes en haut'], secondaryMuscles: ['deltoïdes antérieurs', 'biceps'] },
    { id: 'o_c6', name: 'Écarté haltères incliné', target: 'pectoraux supérieurs', equipment: 'haltères', difficulty: 'débutant', description: 'Variante inclinée de l\'écarté, ciblant davantage la partie supérieure des pectoraux. Excellent exercice d\'isolation pour densifier le haut de la poitrine.', instructions: ['Banc incliné à 30°, haltères bras tendus', 'Écartez les bras en gardant les coudes légèrement fléchis', 'Descendez jusqu\'à l\'étirement du haut des pecs', 'Remontez en arc de cercle en contractant le haut de la poitrine', 'Mouvement lent et contrôlé'], secondaryMuscles: ['deltoïdes antérieurs'] },
    { id: 'o_c7', name: 'Câble croisé haut', target: 'pectoraux inférieurs', equipment: 'câble', difficulty: 'débutant', description: 'Le croisé câble depuis le haut cible le bas et l\'intérieur des pectoraux. La tension constante du câble assure un travail musculaire sur toute l\'amplitude du mouvement.', instructions: ['Réglez les poulies en position haute', 'Saisissez une poignée de chaque côté, faites un pas en avant', 'Fléchissez légèrement les coudes et penchez-vous en avant', 'Ramenez les mains devant vous en bas, en arc de cercle', 'Contractez les pectoraux en fin de mouvement'], secondaryMuscles: ['deltoïdes antérieurs', 'biceps'] },
    { id: 'o_c8', name: 'Câble croisé bas', target: 'pectoraux supérieurs', equipment: 'câble', difficulty: 'débutant', description: 'Le croisé câble depuis le bas cible le haut et l\'intérieur des pectoraux. Excellent exercice de finition pour sculpter le décolleté et définir les pectoraux.', instructions: ['Réglez les poulies en position basse', 'Saisissez les poignées, faites un pas en avant', 'Remontez les mains vers le haut en arc de cercle', 'Les mains se rejoignent devant la poitrine ou au-dessus', 'Gardez une légère flexion des coudes pendant tout le mouvement'], secondaryMuscles: ['deltoïdes antérieurs'] },
    { id: 'o_c9', name: 'Pec deck machine', target: 'pectoraux', equipment: 'machine', difficulty: 'débutant', description: 'La machine pec deck isole parfaitement les pectoraux sans solliciter les stabilisateurs. Idéale pour les débutants ou en fin de séance pour finir les pecs en sécurité.', instructions: ['Réglez le siège pour que les coudes soient à hauteur des épaules', 'Placez les avant-bras contre les coussins', 'Ramenez les bras vers le centre en contractant les pecs', 'Revenez lentement en contrôlant le mouvement', 'Ne laissez pas les plaques toucher entre les séries'], secondaryMuscles: ['deltoïdes antérieurs'] },
    { id: 'o_c10', name: 'Pompes classiques', target: 'pectoraux', equipment: 'poids du corps', difficulty: 'débutant', description: 'L\'exercice fondamental du poids du corps. Les pompes développent la force et l\'endurance des pectoraux, triceps et épaules sans aucun équipement nécessaire.', instructions: ['Positionnez-vous en appui sur les mains et les orteils', 'Mains à la largeur des épaules, corps en ligne droite', 'Descendez en fléchissant les coudes jusqu\'à ce que la poitrine frôle le sol', 'Remontez en poussant fort dans le sol', 'Gardez les abdos contractés tout au long'], secondaryMuscles: ['triceps', 'deltoïdes antérieurs', 'abdominaux'] },
    { id: 'o_c11', name: 'Dips pectoraux', target: 'pectoraux inférieurs', equipment: 'barre parallèle', difficulty: 'intermédiaire', description: 'Les dips sont un exercice compound extrêmement efficace pour le bas des pectoraux et les triceps. En se penchant légèrement en avant, on accentue le travail des pecs.', instructions: ['Montez sur les barres parallèles, bras tendus', 'Penchez le torse légèrement en avant (30°)', 'Descendez lentement jusqu\'à ce que les épaules soient sous les coudes', 'Remontez en poussant fort, sans verrouiller les coudes', 'Plus la flexion vers l\'avant est importante, plus les pecs travaillent'], secondaryMuscles: ['triceps', 'deltoïdes antérieurs'] },
    { id: 'o_c12', name: 'Développé décliné barre', target: 'pectoraux inférieurs', equipment: 'barre', difficulty: 'intermédiaire', description: 'Le développé décliné cible spécifiquement le bas des pectoraux. Il permet souvent de soulever plus lourd que le développé plat, offrant une surcharge importante.', instructions: ['Banc décliné, pieds bloqués sous les rouleaux', 'Saisissez la barre à la largeur des épaules', 'Descendez vers le bas de la poitrine en inspirant', 'Poussez vers le haut en expirant', 'Faites attention lors du reracking car la tête est en bas'], secondaryMuscles: ['triceps', 'deltoïdes antérieurs'] },
    { id: 'o_c13', name: 'Pull-over haltère', target: 'pectoraux', equipment: 'haltère', difficulty: 'débutant', description: 'Le pull-over sollicite à la fois les pectoraux et le grand dorsal dans un mouvement unique. Il étire également la cage thoracique et améliore la mobilité de l\'épaule.', instructions: ['Allongé en travers d\'un banc, épaules appuyées, hanches basses', 'Tenez un haltère à deux mains au-dessus de la poitrine', 'Descendez l\'haltère derrière la tête en inspirant', 'Remontez en arc de cercle en expirant', 'Gardez les coudes légèrement fléchis tout au long'], secondaryMuscles: ['grand dorsal', 'triceps', 'grand dentelé'] },
  ],
  back: [
    { id: 'o_b1', name: 'Tractions pronation', target: 'grand dorsal', equipment: 'barre de traction', difficulty: 'avancé', description: 'Les tractions en pronation sont l\'exercice de référence pour le dos. Elles développent la largeur du grand dorsal et renforcent l\'ensemble de la chaîne postérieure du haut du corps.', instructions: ['Saisissez la barre en pronation, mains plus larges que les épaules', 'Partez en suspension complète, épaules légèrement rétractées', 'Tirez vers le haut en ramenant les coudes vers les hanches', 'Montez jusqu\'à ce que le menton dépasse la barre', 'Descendez lentement en contrôlant le mouvement'], secondaryMuscles: ['biceps', 'rhomboïdes', 'trapèzes', 'deltoïdes postérieurs'] },
    { id: 'o_b2', name: 'Tractions supination', target: 'grand dorsal', equipment: 'barre de traction', difficulty: 'intermédiaire', description: 'Les tractions en supination (chin-up) sollicitent davantage les biceps que les tractions en pronation, tout en travaillant efficacement le grand dorsal. Plus accessibles pour les débutants.', instructions: ['Saisissez la barre en supination, mains à largeur d\'épaules', 'Partez en suspension, corps légèrement incliné vers l\'arrière', 'Tirez vers le haut en guidant les coudes vers les hanches', 'Montez jusqu\'à ce que la poitrine touche la barre', 'Descendez lentement et complètement'], secondaryMuscles: ['biceps', 'rhomboïdes', 'trapèzes'] },
    { id: 'o_b3', name: 'Tirage vertical poulie haute', target: 'grand dorsal', equipment: 'câble', difficulty: 'débutant', description: 'Le tirage vertical est l\'alternative machine aux tractions. Idéal pour les débutants ou pour augmenter le volume d\'entraînement du dos. La prise large cible la largeur du dos.', instructions: ['Réglez le siège pour que les genoux soient bien bloqués', 'Saisissez la barre large en pronation', 'Tirez la barre vers le haut de la poitrine en ramenant les coudes vers le bas', 'Penchez légèrement le torse en arrière', 'Remontez lentement en contrôlant la montée'], secondaryMuscles: ['biceps', 'rhomboïdes', 'trapèzes inférieurs'] },
    { id: 'o_b4', name: 'Rowing barre penché', target: 'grand dorsal', equipment: 'barre', difficulty: 'intermédiaire', description: 'Le rowing barre penché est un exercice compound fondamental pour l\'épaisseur du dos. Il sollicite l\'ensemble des muscles dorsaux ainsi que les biceps et les rhomboïdes.', instructions: ['Pieds à largeur d\'épaules, saisissez la barre en pronation', 'Penchez-vous à environ 45° en gardant le dos droit', 'Tirez la barre vers le bas du ventre en serrant les omoplates', 'Gardez les coudes près du corps', 'Descendez lentement jusqu\'à l\'extension complète des bras'], secondaryMuscles: ['biceps', 'rhomboïdes', 'trapèzes', 'érecteurs du rachis'] },
    { id: 'o_b5', name: 'Rowing haltère 1 bras', target: 'grand dorsal', equipment: 'haltère', difficulty: 'débutant', description: 'Le rowing unilatéral permet de travailler chaque côté du dos indépendamment, corrigeant les déséquilibres. L\'amplitude de mouvement est souvent plus grande qu\'avec la barre.', instructions: ['Appuyez un genou et une main sur le banc pour soutenir le dos', 'Tenez l\'haltère dans l\'autre main, bras tendu', 'Tirez l\'haltère vers la hanche en gardant le coude près du corps', 'Montez jusqu\'à ce que l\'haltère touche le côté du ventre', 'Descendez lentement en contrôlant le mouvement'], secondaryMuscles: ['biceps', 'rhomboïdes', 'trapèzes'] },
    { id: 'o_b6', name: 'Rowing poulie basse', target: 'grand dorsal', equipment: 'câble', difficulty: 'débutant', description: 'Le rowing câble assis offre une tension constante sur tout le mouvement grâce au câble. Excellent pour travailler l\'épaisseur du dos avec un bon contrôle de la charge.', instructions: ['Assis face à la poulie basse, pieds sur les appuis', 'Saisissez la poignée, dos droit, légère cambrure', 'Tirez vers le ventre en ramenant les coudes en arrière', 'Serrez les omoplates en fin de mouvement', 'Revenez lentement en avant sans arrondir le dos'], secondaryMuscles: ['biceps', 'rhomboïdes', 'trapèzes'] },
    { id: 'o_b7', name: 'Rowing T-bar', target: 'grand dorsal', equipment: 'barre', difficulty: 'intermédiaire', description: 'Le rowing T-bar combine les avantages du rowing barre et de la poulie. La position permet de charger lourd tout en maintenant un bon soutien pour le bas du dos.', instructions: ['Enjambez la barre, pieds à largeur d\'épaules', 'Penchez-vous à 45°, saisissez la poignée en V', 'Tirez vers la poitrine en serrant les coudes', 'Serrez les omoplates en haut du mouvement', 'Redescendez lentement et complètement'], secondaryMuscles: ['biceps', 'rhomboïdes', 'érecteurs du rachis'] },
    { id: 'o_b8', name: 'Soulevé de terre', target: 'érecteurs du rachis', equipment: 'barre', difficulty: 'avancé', description: 'Le soulevé de terre est l\'exercice compound roi, sollicitant l\'ensemble du corps. Il développe la force et la masse musculaire globale, en ciblant particulièrement le dos, les fessiers et les ischio-jambiers.', instructions: ['Pieds à largeur de hanches, barre au-dessus des pieds', 'Fléchissez les hanches et les genoux, dos droit, poitrine haute', 'Saisissez la barre en pronation ou en prise alternée', 'Poussez le sol avec les pieds en gardant la barre près du corps', 'Verrouillez les hanches et les genoux en haut, puis redescendez'], secondaryMuscles: ['fessiers', 'ischio-jambiers', 'trapèzes', 'quadriceps', 'abdominaux'] },
    { id: 'o_b9', name: 'Soulevé de terre roumain', target: 'ischio-jambiers', equipment: 'barre', difficulty: 'intermédiaire', description: 'Le soulevé de terre roumain cible spécifiquement les ischio-jambiers et les fessiers via un mouvement de hip hinge. Il est excellent pour développer la force et la flexibilité de la chaîne postérieure.', instructions: ['Debout, barre en main, bras tendus devant les cuisses', 'Poussez les hanches vers l\'arrière en gardant le dos droit', 'Descendez la barre le long des jambes jusqu\'à sentir l\'étirement', 'Remontez en poussant les hanches vers l\'avant', 'Gardez les genoux légèrement fléchis tout au long'], secondaryMuscles: ['fessiers', 'érecteurs du rachis', 'adducteurs'] },
    { id: 'o_b10', name: 'Face pull câble', target: 'trapèzes', equipment: 'câble', difficulty: 'débutant', description: 'Le face pull est essentiel pour la santé des épaules et le développement des deltoïdes postérieurs et trapèzes. Il corrige les déséquilibres créés par trop de travail en poussée.', instructions: ['Réglez la poulie à hauteur du visage ou légèrement au-dessus', 'Saisissez la corde des deux mains, paumes vers le bas', 'Tirez vers votre visage en écartant les mains', 'Ramenez les coudes vers l\'arrière, en dehors', 'Contractez les rhomboïdes et les deltos postérieurs en fin de mouvement'], secondaryMuscles: ['deltoïdes postérieurs', 'rhomboïdes', 'biceps'] },
    { id: 'o_b11', name: 'Shrugs barre', target: 'trapèzes', equipment: 'barre', difficulty: 'débutant', description: 'Les shrugs développent spécifiquement le trapèze supérieur, donnant ce relief caractéristique entre le cou et les épaules. Simple mais très efficace pour des trapèzes imposants.', instructions: ['Tenez la barre devant vous, bras tendus', 'Haussez les épaules le plus haut possible vers les oreilles', 'Tenez la contraction une seconde en haut', 'Redescendez lentement et complètement', 'Ne tournez pas les épaules, mouvement strictement vertical'], secondaryMuscles: ['sterno-cléido-mastoïdien', 'élévateur de la scapula'] },
    { id: 'o_b12', name: 'Extension lombaire machine', target: 'érecteurs du rachis', equipment: 'machine', difficulty: 'débutant', description: 'L\'extension lombaire machine renforce les érecteurs du rachis en sécurité. Indispensable pour prévenir les blessures du bas du dos et améliorer la posture.', instructions: ['Réglez la machine pour que le pivot soit au niveau des hanches', 'Croisez les bras sur la poitrine ou tenez les poignées', 'Penchez-vous en avant sur 45-60°', 'Remontez en contractant les lombaires', 'Mouvement lent et contrôlé, évitez l\'hyperextension'], secondaryMuscles: ['fessiers', 'ischio-jambiers'] },
  ],
  shoulders: [
    { id: 'o_s1', name: 'Développé militaire barre', target: 'deltoïdes', equipment: 'barre', difficulty: 'intermédiaire', description: 'Le développé militaire est l\'exercice fondamental pour les épaules. Il développe l\'ensemble des faisceaux deltoïdiens avec un accent sur le faisceau antérieur, tout en sollicitant les triceps.', instructions: ['Debout ou assis, barre en position de rack à hauteur des clavicules', 'Saisissez la barre légèrement plus large que les épaules', 'Poussez la barre vers le haut en passant devant le visage', 'Verrouillez les bras en haut sans cambrer le dos', 'Redescendez lentement jusqu\'aux clavicules'], secondaryMuscles: ['triceps', 'trapèzes', 'grand dentelé'] },
    { id: 'o_s2', name: 'Développé militaire haltères', target: 'deltoïdes', equipment: 'haltères', difficulty: 'intermédiaire', description: 'Version aux haltères du développé militaire, offrant une meilleure liberté de mouvement et un travail de stabilisation accru. Idéal pour corriger les déséquilibres entre les deux épaules.', instructions: ['Assis sur un banc avec dossier, haltères à hauteur des épaules', 'Prise neutre ou en pronation selon le confort', 'Poussez les haltères vers le haut en les rapprochant légèrement', 'Verrouillez sans claquer les haltères ensemble', 'Redescendez lentement jusqu\'au niveau des oreilles'], secondaryMuscles: ['triceps', 'trapèzes'] },
    { id: 'o_s3', name: 'Développé Arnold', target: 'deltoïdes', equipment: 'haltères', difficulty: 'intermédiaire', description: 'Inventé par Arnold Schwarzenegger, ce développé avec rotation sollicite les trois faisceaux deltoïdiens dans un seul mouvement fluide. Excellent pour un développement complet des épaules.', instructions: ['Assis, haltères devant soi, paumes face à vous', 'Commencez à pousser vers le haut en tournant les paumes vers l\'extérieur', 'Arrivez en haut avec les paumes face à l\'avant', 'Redescendez en effectuant la rotation inverse', 'Mouvement fluide et continu'], secondaryMuscles: ['triceps', 'trapèzes'] },
    { id: 'o_s4', name: 'Élévations latérales haltères', target: 'deltoïdes latéraux', equipment: 'haltères', difficulty: 'débutant', description: 'Les élévations latérales sont l\'exercice d\'isolation par excellence pour le deltoïde latéral. C\'est ce muscle qui donne la largeur aux épaules et crée le fameux V-taper.', instructions: ['Debout, haltères de chaque côté, coudes légèrement fléchis', 'Élevez les bras latéralement jusqu\'à hauteur des épaules', 'Le petit doigt doit être légèrement plus haut que le pouce (comme verser un verre)', 'Descendez lentement en contrôlant le mouvement', 'Évitez de balancer le corps pour prendre de l\'élan'], secondaryMuscles: ['trapèzes', 'surspinatus'] },
    { id: 'o_s5', name: 'Élévations latérales câble', target: 'deltoïdes latéraux', equipment: 'câble', difficulty: 'débutant', description: 'Version câble des élévations latérales, offrant une tension constante sur toute l\'amplitude. La résistance ne disparaît pas en bas du mouvement contrairement aux haltères.', instructions: ['Tenez-vous de côté à la poulie basse', 'Saisissez la poignée de la main opposée à la poulie', 'Élevez le bras latéralement jusqu\'à l\'horizontale', 'Tension constante grâce au câble', 'Revenez lentement en contrôlant'], secondaryMuscles: ['trapèzes'] },
    { id: 'o_s6', name: 'Élévations frontales haltères', target: 'deltoïdes antérieurs', equipment: 'haltères', difficulty: 'débutant', description: 'Les élévations frontales ciblent le faisceau antérieur du deltoïde. Attention à ne pas les surcharger car ce muscle est déjà fortement sollicité dans tous les exercices de poussée.', instructions: ['Debout, haltères devant les cuisses, prise en pronation', 'Élevez un bras (ou les deux) vers l\'avant jusqu\'à l\'horizontale', 'Gardez le coude légèrement fléchi', 'Ne montez pas au-delà des épaules', 'Descendez lentement, ne laissez pas les haltères tomber'], secondaryMuscles: ['pectoraux supérieurs', 'trapèzes'] },
    { id: 'o_s7', name: 'Oiseau haltères', target: 'deltoïdes postérieurs', equipment: 'haltères', difficulty: 'débutant', description: 'L\'oiseau cible le faisceau postérieur du deltoïde, souvent négligé. Essentiel pour l\'équilibre musculaire des épaules et la prévention des blessures, ainsi que pour l\'esthétique vue de côté.', instructions: ['Penché en avant à 90°, haltères sous la poitrine', 'Élevez les bras latéralement en gardant une légère flexion des coudes', 'Montez jusqu\'à ce que les bras soient parallèles au sol', 'Contractez les deltoïdes postérieurs en haut', 'Descendez lentement et ne laissez pas tomber les poids'], secondaryMuscles: ['rhomboïdes', 'trapèzes', 'grand rond'] },
    { id: 'o_s8', name: 'Oiseau machine', target: 'deltoïdes postérieurs', equipment: 'machine', difficulty: 'débutant', description: 'Version machine de l\'oiseau, permettant un meilleur isolement des deltoïdes postérieurs. La machine offre plus de stabilité et permet de se concentrer sur la contraction musculaire.', instructions: ['Réglez le siège pour que les bras soient à hauteur des épaules', 'Saisissez les poignées en pronation', 'Tirez les bras vers l\'arrière en gardant les coudes légèrement fléchis', 'Serrez les omoplates en fin de mouvement', 'Revenez lentement à la position de départ'], secondaryMuscles: ['rhomboïdes', 'trapèzes'] },
    { id: 'o_s9', name: 'Upright row barre', target: 'deltoïdes', equipment: 'barre', difficulty: 'intermédiaire', description: 'L\'upright row développe les deltoïdes et les trapèzes supérieurs. Attention à la prise qui ne doit pas être trop serrée pour éviter une compression des tendons de l\'épaule.', instructions: ['Debout, barre en main, prise en pronation à largeur d\'épaules', 'Tirez la barre vers le haut en guidant les coudes vers le plafond', 'Montez jusqu\'à ce que la barre arrive à hauteur du menton', 'Les coudes restent toujours plus hauts que les poignets', 'Redescendez lentement'], secondaryMuscles: ['trapèzes', 'biceps'] },
    { id: 'o_s10', name: 'Face pull', target: 'deltoïdes postérieurs', equipment: 'câble', difficulty: 'débutant', description: 'Le face pull est un exercice incontournable pour la santé et l\'esthétique des épaules. Il renforce les deltoïdes postérieurs et les muscles de la coiffe des rotateurs, prévenant les blessures.', instructions: ['Poulie à hauteur du visage avec corde ou poignée', 'Saisissez la corde, paumes vers le bas', 'Tirez vers votre visage en écartant les deux mains', 'Les coudes partent vers l\'extérieur et l\'arrière', 'Contractez fort les deltos postérieurs en fin de mouvement'], secondaryMuscles: ['rhomboïdes', 'trapèzes', 'coiffe des rotateurs'] },
  ],
  'upper arms': [
    { id: 'o_a1', name: 'Curl barre droite', target: 'biceps', equipment: 'barre', difficulty: 'débutant', description: 'Le curl barre est l\'exercice classique pour développer la masse des biceps. La barre droite permet de charger plus lourd mais peut mettre les poignets en tension.', instructions: ['Debout, saisissez la barre en supination à largeur d\'épaules', 'Gardez les coudes collés contre le corps', 'Fléchissez les avant-bras jusqu\'à ce que la barre arrive aux épaules', 'Contractez les biceps fort en haut', 'Redescendez lentement jusqu\'à l\'extension complète'], secondaryMuscles: ['brachial', 'brachioradial'] },
    { id: 'o_a2', name: 'Curl barre EZ', target: 'biceps', equipment: 'barre EZ', difficulty: 'débutant', description: 'La barre EZ réduit la tension sur les poignets comparée à la barre droite. Elle permet un travail efficace des biceps avec moins de risque de blessure aux articulations.', instructions: ['Tenez la barre EZ aux prises inclinées, en supination partielle', 'Coudes fixés contre le corps', 'Fléchissez jusqu\'aux épaules en contractant les biceps', 'Descendez lentement et complètement', 'Évitez de balancer le torse'], secondaryMuscles: ['brachial', 'brachioradial'] },
    { id: 'o_a3', name: 'Curl haltères alternés', target: 'biceps', equipment: 'haltères', difficulty: 'débutant', description: 'Le curl alterné permet de se concentrer sur un biceps à la fois et d\'effectuer une supination complète du poignet, maximisant la contraction du biceps. Excellent pour le pic du biceps.', instructions: ['Debout ou assis, haltères le long du corps', 'Fléchissez un bras à la fois en tournant la paume vers le haut', 'Contractez fort en haut du mouvement', 'Descendez lentement pendant que l\'autre bras monte', 'Alternez les bras de façon fluide'], secondaryMuscles: ['brachial', 'brachioradial', 'deltoïdes antérieurs'] },
    { id: 'o_a4', name: 'Curl marteau', target: 'biceps brachial', equipment: 'haltères', difficulty: 'débutant', description: 'Le curl marteau avec prise neutre cible davantage le brachial et le brachioradial, deux muscles qui contribuent à l\'épaisseur et la largeur des bras. Essentiel pour des bras complets.', instructions: ['Debout, haltères en prise neutre (paumes face à face)', 'Fléchissez les avant-bras en gardant la prise neutre', 'Montez jusqu\'à ce que l\'haltère soit à hauteur des épaules', 'Descendez lentement en contrôlant', 'Coudes fixes, ne bougez pas les épaules'], secondaryMuscles: ['brachial', 'brachioradial'] },
    { id: 'o_a5', name: 'Curl incliné haltères', target: 'biceps', equipment: 'haltères', difficulty: 'intermédiaire', description: 'Le curl incliné place les biceps en position d\'étirement maximal au début du mouvement, créant une tension différente des curls debout. Excellent pour développer la longueur et le pic des biceps.', instructions: ['Allongé sur banc incliné à 45-60°, bras pendants', 'Fléchissez les avant-bras en supinant les poignets', 'Montez jusqu\'aux épaules en contractant fort', 'Descendez très lentement, l\'étirement est la clé', 'Ne balancez pas les bras'], secondaryMuscles: ['brachial'] },
    { id: 'o_a6', name: 'Curl pupitre barre EZ', target: 'biceps', equipment: 'barre EZ', difficulty: 'débutant', description: 'Le curl au pupitre (Scott curl) isole parfaitement les biceps en éliminant toute aide du dos ou des épaules. C\'est l\'exercice préféré de Larry Scott, premier Mr. Olympia, pour son pic de biceps.', instructions: ['Appuyez les bras sur le pupitre, coudes sur le coussin', 'Saisissez la barre EZ en supination', 'Fléchissez jusqu\'aux épaules en contractant les biceps', 'Descendez lentement jusqu\'à l\'extension complète', 'Ne soulevez pas les coudes du pupitre'], secondaryMuscles: ['brachial'] },
    { id: 'o_a7', name: 'Curl câble bas', target: 'biceps', equipment: 'câble', difficulty: 'débutant', description: 'Le curl câble offre une tension constante sur les biceps contrairement aux haltères. La résistance est identique tout au long du mouvement, maximisant le temps sous tension.', instructions: ['Face à la poulie basse, saisissez la barre ou les poignées', 'Coudes fixés contre le corps', 'Fléchissez les avant-bras vers les épaules', 'Contractez fort en haut et descendez lentement', 'Profitez de la tension constante du câble'], secondaryMuscles: ['brachial', 'brachioradial'] },
    { id: 'o_a8', name: 'Curl concentration', target: 'biceps', equipment: 'haltère', difficulty: 'débutant', description: 'Le curl concentration isole un biceps à la fois avec le coude appuyé contre la cuisse. C\'est l\'exercice idéal pour finir une séance bras et maximiser le pic du biceps.', instructions: ['Assis sur un banc, penché en avant', 'Appuyez le coude contre la face interne de la cuisse', 'Fléchissez l\'avant-bras vers le haut en supinant le poignet', 'Contractez fort et tenez une seconde', 'Descendez lentement jusqu\'à l\'extension complète'], secondaryMuscles: ['brachial'] },
    { id: 'o_a9', name: 'Barre au front', target: 'triceps', equipment: 'barre EZ', difficulty: 'intermédiaire', description: 'Le skull crusher (barre au front) est l\'un des meilleurs exercices d\'isolation pour les triceps, ciblant les 3 faisceaux. Il permet de charger lourd et de développer la masse et la force des triceps.', instructions: ['Allongé sur banc plat, barre EZ tenue bras tendus au-dessus de la poitrine', 'Fléchissez uniquement les coudes en abaissant la barre vers le front', 'Gardez les coudes fixes, pointés vers le plafond', 'Remontez en poussant vers le haut jusqu\'à l\'extension', 'Mouvement lent et contrôlé surtout à la descente'], secondaryMuscles: ['anconé'] },
    { id: 'o_a10', name: 'Pushdown corde', target: 'triceps', equipment: 'câble', difficulty: 'débutant', description: 'Le pushdown à la corde est excellent pour les triceps car il permet d\'écarter les mains en bas, maximisant la contraction. La corde isole bien les trois faisceaux des triceps.', instructions: ['Face à la poulie haute, saisissez la corde', 'Coudes fixés contre le corps, buste légèrement penché', 'Poussez vers le bas en écartant les deux extrémités de la corde', 'Contractez fort les triceps en bas', 'Remontez lentement jusqu\'à 90° de flexion'], secondaryMuscles: ['anconé'] },
    { id: 'o_a11', name: 'Extension triceps câble', target: 'triceps', equipment: 'câble', difficulty: 'débutant', description: 'L\'extension triceps au câble avec barre droite ou EZ offre une tension constante sur les triceps. La poulie haute permet de cibler spécifiquement le long faisceau des triceps.', instructions: ['Face à la poulie haute, barre saisie en pronation', 'Coudes serrés contre le corps', 'Poussez la barre vers le bas jusqu\'à extension complète', 'Contractez les triceps fort en bas', 'Remontez lentement en contrôlant'], secondaryMuscles: ['anconé'] },
    { id: 'o_a12', name: 'Extension haltère 1 bras', target: 'triceps', equipment: 'haltère', difficulty: 'débutant', description: 'L\'extension triceps unilatérale permet de corriger les déséquilibres entre les bras et offre une grande amplitude de mouvement. Elle cible particulièrement le long faisceau des triceps.', instructions: ['Debout ou assis, tenez l\'haltère d\'une main au-dessus de la tête', 'Fléchissez le coude en abaissant l\'haltère derrière la tête', 'Gardez le coude pointé vers le plafond, immobile', 'Remontez en contractant le triceps', 'L\'autre main peut soutenir le coude pour plus de stabilité'], secondaryMuscles: [] },
    { id: 'o_a13', name: 'Dips triceps', target: 'triceps', equipment: 'barre parallèle', difficulty: 'intermédiaire', description: 'Les dips triceps avec le corps vertical sont l\'exercice compound le plus efficace pour les triceps. Ils permettent de charger lourd (avec ceinture lestée) pour une progression rapide.', instructions: ['Montez sur les barres, bras tendus, corps vertical', 'Gardez le torse droit, ne vous penchez pas en avant', 'Fléchissez les coudes jusqu\'à 90° minimum', 'Poussez vers le haut jusqu\'à l\'extension complète', 'Pour plus d\'isolation : gardez les jambes droites et croisées'], secondaryMuscles: ['pectoraux', 'deltoïdes antérieurs'] },
    { id: 'o_a14', name: 'Close grip bench press', target: 'triceps', equipment: 'barre', difficulty: 'intermédiaire', description: 'Le développé couché prise serrée est l\'exercice compound par excellence pour les triceps. Il permet de soulever des charges importantes, favorisant la masse et la force des triceps.', instructions: ['Allongé sur banc plat, prise en pronation à largeur d\'épaules ou plus serrée', 'Descendez la barre vers le bas de la poitrine/sternum', 'Gardez les coudes le long du corps', 'Poussez vers le haut jusqu\'à l\'extension complète', 'Ne prenez pas une prise trop serrée pour protéger les poignets'], secondaryMuscles: ['pectoraux', 'deltoïdes antérieurs'] },
    { id: 'o_a15', name: 'Kick-back haltère', target: 'triceps', equipment: 'haltère', difficulty: 'débutant', description: 'Le kick-back isole les triceps en position d\'extension complète. Efficace pour la définition des triceps et particulièrement utile pour finir une séance avec une bonne congestion.', instructions: ['Penché en avant à 90°, coude fixé à hauteur des hanches', 'L\'avant-bras pointe vers le sol à 90° de flexion', 'Étendez le bras vers l\'arrière jusqu\'à extension complète', 'Contractez le triceps fort en extension', 'Revenez à 90° lentement sans balancer'], secondaryMuscles: [] },
  ],
  'lower arms': [
    { id: 'o_fa1', name: 'Curl poignet barre', target: 'avant-bras', equipment: 'barre', difficulty: 'débutant', description: 'Le curl de poignet renforce les fléchisseurs des avant-bras. Des avant-bras forts améliorent la performance dans tous les exercices de tirage et de préhension.', instructions: ['Assis, avant-bras sur les cuisses, barre en supination', 'Laissez la barre descendre jusqu\'au bout des doigts', 'Fléchissez les poignets vers le haut en contractant les avant-bras', 'Mouvement de faible amplitude mais grande contraction', 'Descendez lentement et complètement'], secondaryMuscles: [] },
    { id: 'o_fa2', name: 'Curl poignet inversé', target: 'avant-bras', equipment: 'barre', difficulty: 'débutant', description: 'Le curl inversé cible les extenseurs des avant-bras, souvent négligés. Un développement équilibré des avant-bras prévient les blessures aux coudes et améliore la performance.', instructions: ['Assis, avant-bras sur les cuisses, barre en pronation', 'Fléchissez les poignets vers le haut', 'Contractez les extenseurs des avant-bras', 'Descendez lentement et complètement', 'Charge légère car les extenseurs sont moins forts que les fléchisseurs'], secondaryMuscles: [] },
    { id: 'o_fa3', name: 'Farmer walk', target: 'avant-bras', equipment: 'haltères', difficulty: 'débutant', description: 'Le farmer walk développe la force de préhension, les avant-bras, les trapèzes et le gainage général. Simple mais incroyablement efficace pour des avant-bras fonctionnels et robustes.', instructions: ['Tenez des haltères lourds de chaque côté', 'Marchez sur une distance déterminée en gardant le dos droit', 'Épaules en arrière, poitrine haute', 'Serrez fort les haltères tout au long', 'Posez les haltères lorsque vous ne pouvez plus tenir'], secondaryMuscles: ['trapèzes', 'abdominaux', 'deltoïdes'] },
    { id: 'o_fa4', name: 'Rotation poignet câble', target: 'avant-bras', equipment: 'câble', difficulty: 'débutant', description: 'La rotation de poignet au câble renforce les supinateurs et pronateurs des avant-bras. Excellent pour la santé des coudes et la prévention des tendinites.', instructions: ['Saisissez la poignée du câble bas', 'Effectuez une rotation du poignet en supination ou pronation', 'Mouvement lent et contrôlé', 'Amplitude complète à chaque répétition', 'Charge légère, concentration sur la sensation'], secondaryMuscles: [] },
  ],
  'upper legs': [
    { id: 'o_l1', name: 'Squat barre', target: 'quadriceps', equipment: 'barre', difficulty: 'intermédiaire', description: 'Le squat barre est le roi des exercices de jambes. Il développe la masse et la force de l\'ensemble des membres inférieurs tout en stimulant la production hormonale. Incontournable.', instructions: ['Barre sur les trapèzes, pieds à largeur d\'épaules ou plus', 'Inspirez et braceez le core avant de descendre', 'Descendez en poussant les genoux vers l\'extérieur sur la ligne des orteils', 'Cuisses parallèles au sol ou en dessous', 'Remontez en poussant le sol, expirez en montant'], secondaryMuscles: ['fessiers', 'ischio-jambiers', 'mollets', 'abdominaux'] },
    { id: 'o_l2', name: 'Squat haltères', target: 'quadriceps', equipment: 'haltères', difficulty: 'débutant', description: 'Le squat aux haltères est une excellente alternative au squat barre, particulièrement pour les débutants. Il permet de travailler les jambes sans nécessiter un rack ni maîtriser la technique barre.', instructions: ['Tenez les haltères de chaque côté ou en goblet', 'Pieds à largeur d\'épaules, orteils légèrement ouverts', 'Descendez en gardant le dos droit et la poitrine haute', 'Genoux dans l\'axe des orteils', 'Remontez en poussant fort dans le sol'], secondaryMuscles: ['fessiers', 'ischio-jambiers'] },
    { id: 'o_l3', name: 'Leg press', target: 'quadriceps', equipment: 'machine', difficulty: 'débutant', description: 'La leg press permet de surcharger les jambes sans la contrainte du bas du dos. En variant le placement des pieds, on peut cibler davantage les quadriceps, les ischio-jambiers ou les fessiers.', instructions: ['Asseyez-vous dans la machine, dos plaqué contre le dossier', 'Pieds à largeur d\'épaules sur la plateforme', 'Déverrouillez et descendez jusqu\'à 90° de flexion du genou', 'Poussez la plateforme sans verrouiller les genoux', 'Ne laissez pas les fesses décoller du siège'], secondaryMuscles: ['fessiers', 'ischio-jambiers', 'mollets'] },
    { id: 'o_l4', name: 'Leg extension', target: 'quadriceps', equipment: 'machine', difficulty: 'débutant', description: 'La leg extension isole parfaitement les quadriceps. Excellente pour finir une séance jambes et pour la définition des cuisses. Travaille les 4 chefs du quadriceps, notamment le vaste médial.', instructions: ['Assis, dos contre le dossier, cheville sous le coussin', 'Étendez les jambes vers le haut jusqu\'à l\'extension complète', 'Contractez fort les quadriceps en haut', 'Descendez lentement sans laisser les poids tomber', 'Tenez une seconde en haut pour maximiser la contraction'], secondaryMuscles: [] },
    { id: 'o_l5', name: 'Fentes avant haltères', target: 'quadriceps', equipment: 'haltères', difficulty: 'débutant', description: 'Les fentes développent les quadriceps, les fessiers et améliorent la stabilité et l\'équilibre. Elles corrigent les déséquilibres entre les jambes et améliorent la coordination.', instructions: ['Debout, haltères en main, faites un grand pas en avant', 'Descendez le genou arrière vers le sol sans le toucher', 'Le genou avant ne dépasse pas les orteils', 'Remontez en poussant avec le pied avant', 'Alternez les jambes ou faites toutes les reps d\'un côté'], secondaryMuscles: ['fessiers', 'ischio-jambiers', 'mollets'] },
    { id: 'o_l6', name: 'Bulgarian split squat', target: 'quadriceps', equipment: 'haltères', difficulty: 'avancé', description: 'Le Bulgarian split squat est l\'exercice unilatéral le plus efficace pour les jambes. Il cible intensément les quadriceps et les fessiers tout en travaillant la stabilité et la flexibilité des hanches.', instructions: ['Pied arrière posé sur un banc, haltères en main', 'Descendez le genou arrière vers le sol', 'Le torse reste droit, genou avant dans l\'axe', 'Poussez avec le talon avant pour remonter', 'Amplitude complète pour maximiser le travail des fessiers'], secondaryMuscles: ['fessiers', 'ischio-jambiers', 'mollets'] },
    { id: 'o_l7', name: 'Hack squat machine', target: 'quadriceps', equipment: 'machine', difficulty: 'intermédiaire', description: 'Le hack squat machine permet un travail intensif des quadriceps avec moins de stress sur le bas du dos. La position inclinée favorise une grande amplitude et une forte contraction des cuisses.', instructions: ['Positionnez les épaules sous les coussins, dos contre le dossier', 'Pieds à largeur d\'épaules ou légèrement plus', 'Descendez lentement jusqu\'à 90° ou plus', 'Remontez en poussant fort sans verrouiller les genoux', 'Genoux dans l\'axe des orteils tout au long'], secondaryMuscles: ['fessiers', 'ischio-jambiers'] },
    { id: 'o_l8', name: 'Hip thrust barre', target: 'fessiers', equipment: 'barre', difficulty: 'intermédiaire', description: 'Le hip thrust est l\'exercice numéro un pour développer les fessiers. Il permet une activation maximale du grand fessier et une surcharge progressive importante. Incontournable pour des fessiers développés.', instructions: ['Dos appuyé contre un banc, barre au niveau des hanches', 'Pieds à plat, genoux à 90° en haut du mouvement', 'Poussez les hanches vers le haut en contractant les fessiers', 'Tenez la position haute une seconde', 'Descendez lentement sans toucher le sol avec les hanches'], secondaryMuscles: ['ischio-jambiers', 'quadriceps', 'abdominaux'] },
    { id: 'o_l9', name: 'Leg curl couché', target: 'ischio-jambiers', equipment: 'machine', difficulty: 'débutant', description: 'Le leg curl couché isole les ischio-jambiers efficacement. Les muscles bi-articulaires (ischios) sont souvent négligés mais essentiels pour l\'équilibre musculaire et la prévention des blessures.', instructions: ['Allongé face vers le bas, chevilles sous les coussins', 'Fléchissez les jambes vers les fessiers', 'Contractez fort les ischio-jambiers en haut', 'Descendez lentement jusqu\'à l\'extension complète', 'Évitez de soulever les hanches pendant le mouvement'], secondaryMuscles: ['mollets', 'fessiers'] },
    { id: 'o_l10', name: 'Leg curl assis', target: 'ischio-jambiers', equipment: 'machine', difficulty: 'débutant', description: 'Le leg curl assis cible les ischio-jambiers dans une position différente du leg curl couché, changeant légèrement l\'angle de travail. La position assise met l\'accent sur la tête courte du biceps fémoral.', instructions: ['Assis dans la machine, dos contre le dossier', 'Chevilles sur le coussin supérieur, cuisses bloquées', 'Fléchissez les jambes sous le siège', 'Contractez les ischio-jambiers en bas du mouvement', 'Remontez lentement en contrôlant'], secondaryMuscles: ['mollets'] },
    { id: 'o_l11', name: 'Soulevé de terre roumain', target: 'ischio-jambiers', equipment: 'barre', difficulty: 'intermédiaire', description: 'Le soulevé de terre roumain est l\'exercice compound le plus efficace pour les ischio-jambiers. Il les sollicite en étirement, créant une tension maximale favorable à la croissance musculaire.', instructions: ['Debout, barre en pronation devant les cuisses', 'Gardez la barre près des jambes en descendant', 'Poussez les hanches vers l\'arrière, dos droit', 'Descendez jusqu\'à sentir l\'étirement des ischio-jambiers', 'Remontez en poussant les hanches vers l\'avant'], secondaryMuscles: ['fessiers', 'érecteurs du rachis', 'grand dorsal'] },
    { id: 'o_l12', name: 'Nordic curl', target: 'ischio-jambiers', equipment: 'poids du corps', difficulty: 'avancé', description: 'Le nordic curl est l\'exercice le plus difficile et efficace pour les ischio-jambiers. Il travaille de façon excentrique, renforçant les ischio-jambiers et prévenant les blessures aux tendons.', instructions: ['Agenouillé, chevilles bloquées sous un banc ou par un partenaire', 'Bras croisés sur la poitrine ou devant vous', 'Descendez le plus lentement possible vers le sol', 'Utilisez les mains pour amortir la chute si nécessaire', 'Remontez en poussant avec les mains au sol'], secondaryMuscles: ['mollets', 'fessiers'] },
    { id: 'o_l13', name: 'Abduction machine', target: 'fessiers', equipment: 'machine', difficulty: 'débutant', description: 'L\'abduction machine cible le moyen fessier, muscle crucial pour la stabilité du bassin et la forme des hanches. Souvent négligé mais essentiel pour un développement complet des fessiers.', instructions: ['Assis dans la machine, genoux contre les coussins', 'Écartez les jambes contre la résistance', 'Contractez les fessiers et le moyen fessier en fin de mouvement', 'Revenez lentement sans laisser les poids tomber', 'Gardez le dos droit contre le dossier'], secondaryMuscles: ['tenseur du fascia lata'] },
  ],
  'lower legs': [
    { id: 'o_cl1', name: 'Mollets debout machine', target: 'soléaire et gastrocnémiens', equipment: 'machine', difficulty: 'débutant', description: 'Le mollet debout machine cible principalement les gastrocnémiens (la bosse visible des mollets). La jambe tendue est la position la plus efficace pour le gastrocnémien, muscle bi-articulaire.', instructions: ['Épaules sous les coussins, avant-pied sur la marche', 'Descendez les talons le plus bas possible pour l\'étirement', 'Montez le plus haut possible sur la pointe des pieds', 'Contractez fort en haut et tenez une seconde', 'Descendez lentement, l\'étirement est crucial pour la croissance'], secondaryMuscles: ['soléaire'] },
    { id: 'o_cl2', name: 'Mollets assis machine', target: 'soléaire', equipment: 'machine', difficulty: 'débutant', description: 'Le mollet assis cible spécifiquement le soléaire car le genou fléchi désactive le gastrocnémien. Essentiel pour développer l\'épaisseur des mollets sous la bosse principale.', instructions: ['Assis, genoux sous les coussins, avant-pied sur la marche', 'Descendez les talons pour étirer le soléaire', 'Montez le plus haut possible en contractant', 'Tenez en haut une seconde', 'Descendez lentement et complètement'], secondaryMuscles: [] },
    { id: 'o_cl3', name: 'Mollets leg press', target: 'mollets', equipment: 'machine', difficulty: 'débutant', description: 'Les mollets à la leg press permettent une grande amplitude de mouvement et une bonne surcharge. La position allongée réduit le stress sur les genoux comparé au mollet debout.', instructions: ['Jambes presque tendues sur la plateforme, avant-pied sur le bord', 'Laissez la plateforme descendre pour étirer les mollets', 'Poussez avec l\'avant-pied pour monter', 'Contractez fort en haut', 'Mouvement lent et contrôlé'], secondaryMuscles: [] },
    { id: 'o_cl4', name: 'Mollets haltères', target: 'mollets', equipment: 'haltères', difficulty: 'débutant', description: 'Le mollet unidirectionnel avec haltère permet de corriger les déséquilibres entre les deux mollets. Peut se faire sur une marche pour maximiser l\'amplitude.', instructions: ['Debout sur un pied, haltère dans la main du même côté', 'L\'autre main s\'appuie pour l\'équilibre', 'Descente maximale puis montée maximale', 'Contraction forte en haut', 'Faites toutes les reps avant de changer de jambe'], secondaryMuscles: [] },
    { id: 'o_cl5', name: 'Mollets sur marche', target: 'mollets', equipment: 'poids du corps', difficulty: 'débutant', description: 'Le mollet au poids du corps sur une marche est parfait pour débuter ou pour l\'entraînement à domicile. Simple mais efficace avec une amplitude de mouvement maximale.', instructions: ['Avant-pied sur le bord d\'une marche, talons dans le vide', 'Descendez les talons le plus bas possible', 'Montez sur la pointe des pieds le plus haut possible', 'Tenez la contraction en haut', 'Effectuez le mouvement sur une ou deux jambes'], secondaryMuscles: [] },
  ],
  waist: [
    { id: 'o_ab1', name: 'Crunch classique', target: 'abdominaux', equipment: 'poids du corps', difficulty: 'débutant', description: 'Le crunch classique cible les abdominaux supérieurs. C\'est l\'exercice abdominal de base, accessible à tous. Une exécution lente et contrôlée vaut mieux que des répétitions rapides.', instructions: ['Allongé sur le dos, genoux fléchis, pieds à plat', 'Mains derrière la tête ou croisées sur la poitrine', 'Contractez les abdos pour soulever les épaules du sol', 'Ne tirez pas sur le cou avec les mains', 'Descendez lentement sans poser complètement le dos'], secondaryMuscles: ['obliques'] },
    { id: 'o_ab2', name: 'Crunch inversé', target: 'abdominaux inférieurs', equipment: 'poids du corps', difficulty: 'débutant', description: 'Le crunch inversé cible les abdominaux inférieurs, zone souvent difficile à développer. En levant les hanches plutôt que le torse, on inverse le mouvement du crunch classique.', instructions: ['Allongé sur le dos, bras le long du corps', 'Genoux fléchis à 90° au-dessus du ventre', 'Contractez les abdos pour ramener les genoux vers la poitrine', 'Les hanches décollent légèrement du sol', 'Revenez lentement sans poser les pieds'], secondaryMuscles: ['iliopsoas'] },
    { id: 'o_ab3', name: 'Planche', target: 'abdominaux', equipment: 'poids du corps', difficulty: 'débutant', description: 'La planche est l\'exercice de gainage fondamental. Elle renforce l\'ensemble de la ceinture abdominale, améliore la posture et protège le bas du dos. La durée prime sur la vitesse.', instructions: ['En appui sur les avant-bras et les orteils', 'Corps en ligne droite de la tête aux pieds', 'Contractez les abdos, les fessiers et les quadriceps', 'Respirez normalement, ne retenez pas le souffle', 'Maintenez la position aussi longtemps que possible'], secondaryMuscles: ['fessiers', 'quadriceps', 'deltoïdes'] },
    { id: 'o_ab4', name: 'Planche latérale', target: 'obliques', equipment: 'poids du corps', difficulty: 'débutant', description: 'La planche latérale cible spécifiquement les obliques et le carré des lombes. Elle améliore la stabilité latérale du tronc, essentielle pour prévenir les blessures et améliorer les performances.', instructions: ['En appui sur un avant-bras et le côté du pied', 'Corps en ligne droite, hanches soulevées', 'L\'autre bras le long du corps ou vers le plafond', 'Contractez les obliques pour maintenir la position', 'Échangez les côtés après le temps imparti'], secondaryMuscles: ['abdominaux', 'fessiers'] },
    { id: 'o_ab5', name: 'Mountain climbers', target: 'abdominaux', equipment: 'poids du corps', difficulty: 'débutant', description: 'Les mountain climbers combinent gainage abdominal et cardio. Ils sollicitent les abdominaux, les hip flexors et élèvent le rythme cardiaque, en faisant un exercice fonctionnel complet.', instructions: ['Position de pompe, mains sous les épaules', 'Ramenez alternativement les genoux vers la poitrine', 'Gardez les hanches basses, le dos plat', 'Rythme soutenu sans perdre la forme', 'Respirez de façon régulière'], secondaryMuscles: ['iliopsoas', 'deltoïdes', 'quadriceps'] },
    { id: 'o_ab6', name: 'Russian twist', target: 'obliques', equipment: 'poids du corps', difficulty: 'débutant', description: 'Le russian twist est excellent pour les obliques et la rotation du tronc. Peut être réalisé au poids du corps ou avec un poids (médecine ball, haltère) pour plus de résistance.', instructions: ['Assis au sol, genoux fléchis, pieds décollés ou posés', 'Penchez légèrement le torse en arrière', 'Tournez le torse alternativement à gauche et à droite', 'Les mains se rapprochent du sol à chaque rotation', 'Gardez les abdos contractés tout au long'], secondaryMuscles: ['abdominaux', 'iliopsoas'] },
    { id: 'o_ab7', name: 'Leg raises', target: 'abdominaux inférieurs', equipment: 'poids du corps', difficulty: 'intermédiaire', description: 'Les leg raises allongés sont un exercice efficace pour le bas des abdominaux et les hip flexors. La difficulté peut être augmentée en gardant les jambes tendues.', instructions: ['Allongé sur le dos, mains sous les fesses ou le long du corps', 'Gardez les jambes tendues ou légèrement fléchies', 'Levez les jambes jusqu\'à la verticale', 'Descendez lentement sans toucher le sol', 'Contractez les abdos tout au long du mouvement'], secondaryMuscles: ['iliopsoas', 'quadriceps'] },
    { id: 'o_ab8', name: 'Hanging leg raises', target: 'abdominaux', equipment: 'barre de traction', difficulty: 'avancé', description: 'Les hanging leg raises en suspension sont l\'un des exercices abdominaux les plus difficiles et efficaces. Ils sollicitent toute la sangle abdominale avec une forte composante des abdos inférieurs.', instructions: ['Suspendu à une barre de traction, prise à largeur d\'épaules', 'Contractez les abdos et levez les jambes', 'Pour débutants : genoux fléchis vers la poitrine', 'Pour avancés : jambes tendues jusqu\'à la barre', 'Descendez lentement sans balancer'], secondaryMuscles: ['iliopsoas', 'quadriceps', 'avant-bras'] },
    { id: 'o_ab9', name: 'Ab wheel', target: 'abdominaux', equipment: 'roue abdominale', difficulty: 'avancé', description: 'La roue abdominale est l\'un des exercices de gainage les plus exigeants. Elle sollicite l\'ensemble de la sangle abdominale, les dorsaux et les épaules dans un mouvement de plancher au sol.', instructions: ['Agenouillé, mains sur la roue devant vous', 'Déroulez vers l\'avant en gardant le dos droit', 'Allez aussi loin que vous pouvez maintenir le gainage', 'Contractez les abdos pour revenir à la position initiale', 'Progression : aller plus loin à chaque séance'], secondaryMuscles: ['grand dorsal', 'deltoïdes', 'érecteurs du rachis'] },
    { id: 'o_ab10', name: 'Crunch câble', target: 'abdominaux', equipment: 'câble', difficulty: 'débutant', description: 'Le crunch câble permet de surcharger progressivement les abdominaux contrairement aux exercices au poids du corps. C\'est l\'exercice idéal pour développer la masse des abdominaux.', instructions: ['À genoux face à la poulie haute, corde saisie derrière la tête', 'Fléchissez le tronc vers le bas en contractant les abdos', 'Amenez les coudes vers les genoux', 'Gardez les hanches fixes, seul le torse bouge', 'Remontez lentement sans complètement décontracter'], secondaryMuscles: ['obliques'] },
    { id: 'o_ab11', name: 'Bicycle crunch', target: 'obliques', equipment: 'poids du corps', difficulty: 'débutant', description: 'Le bicycle crunch sollicite simultanément les obliques et les abdominaux droits dans un mouvement rotatoire. Études EMG montrent que c\'est l\'un des exercices qui activent le plus les obliques.', instructions: ['Allongé sur le dos, mains derrière la tête', 'Jambes décollées du sol, genoux à 90°', 'Ramenez le coude droit vers le genou gauche et vice versa', 'Étendez la jambe opposée pendant la rotation', 'Mouvement fluide, ne tirez pas sur le cou'], secondaryMuscles: ['abdominaux'] },
    { id: 'o_ab12', name: 'Dragon flag', target: 'abdominaux', equipment: 'banc', difficulty: 'avancé', description: 'Le dragon flag est un exercice avancé popularisé par Bruce Lee. Il sollicite intensément toute la sangle abdominale et les muscles stabilisateurs du tronc dans un mouvement de gainage dynamique.', instructions: ['Allongé sur un banc, mains accrochées derrière la tête', 'Élevez tout le corps en ligne droite en prenant appui sur les épaules', 'Descendez lentement en gardant le corps rigide', 'Ne laissez pas les hanches s\'effondrer', 'Remontez en contractant l\'ensemble du core'], secondaryMuscles: ['érecteurs du rachis', 'fessiers', 'ischio-jambiers'] },
  ],
  cardio: [
    { id: 'o_cd1', name: 'Course à pied', target: 'cardio', equipment: 'poids du corps', difficulty: 'débutant', description: 'La course à pied est l\'exercice cardio par excellence. Elle améliore l\'endurance cardiovasculaire, brûle efficacement les calories et libère des endorphines. Adaptez le rythme à votre niveau.', instructions: ['Commencez par un échauffement de 5 minutes en marchant vite', 'Adoptez une foulée naturelle, atterrissage sur le milieu du pied', 'Bras fléchis à 90°, oscillant naturellement', 'Respirez en rythme avec votre foulée', 'Terminez par 5 minutes de marche pour récupérer'], secondaryMuscles: [] },
    { id: 'o_cd2', name: 'Vélo elliptique', target: 'cardio', equipment: 'machine', difficulty: 'débutant', description: 'L\'elliptique offre un cardio full body à faible impact articulaire. Idéal pour les personnes ayant des problèmes de genoux ou de dos. Il sollicite à la fois le haut et le bas du corps.', instructions: ['Montez sur la machine, pieds sur les pédales', 'Saisissez les poignées mobiles', 'Poussez et tirez les bras en synchronisation avec les jambes', 'Gardez le dos droit, ne vous penchez pas sur les poignées', 'Variez la résistance et l\'inclinaison pour plus d\'intensité'], secondaryMuscles: [] },
    { id: 'o_cd3', name: 'Vélo stationnaire', target: 'cardio', equipment: 'machine', difficulty: 'débutant', description: 'Le vélo stationnaire est un cardio doux pour les articulations. Parfait pour s\'échauffer, récupérer activement ou faire des sessions HIIT intenses en variant la résistance.', instructions: ['Réglez le siège à la hauteur de vos hanches', 'Pieds bien calés dans les pédales', 'Cadence régulière, poussez et tirez les pédales', 'Dos droit, légèrement penché en avant', 'Variez résistance et cadence selon l\'objectif'], secondaryMuscles: [] },
    { id: 'o_cd4', name: 'Rameur', target: 'cardio', equipment: 'machine', difficulty: 'intermédiaire', description: 'Le rameur est l\'un des meilleurs exercices cardio car il sollicite 86% des muscles du corps. Il développe l\'endurance, la force fonctionnelle et brûle énormément de calories.', instructions: ['Position de départ : genoux fléchis, poignée saisie, dos droit', 'Poussez avec les jambes en premier', 'Penchez le torse légèrement en arrière', 'Terminez en tirant la poignée vers le bas de la poitrine', 'Revenez en ordre inverse : bras, torse, jambes'], secondaryMuscles: [] },
    { id: 'o_cd5', name: 'Corde à sauter', target: 'cardio', equipment: 'corde', difficulty: 'débutant', description: 'La corde à sauter est un outil cardio exceptionnel : accessible, peu coûteux et très efficace pour la coordination, l\'endurance et la brûlure calorique. 10 minutes valent 30 minutes de jogging.', instructions: ['Corde ajustée à votre taille (poignées à hauteur des aisselles)', 'Sautez sur l\'avant du pied, pas sur les talons', 'Petits sauts, juste assez hauts pour passer la corde', 'Poignets font tourner la corde, pas les épaules', 'Commencez par 30 secondes et augmentez progressivement'], secondaryMuscles: [] },
    { id: 'o_cd6', name: 'Burpees', target: 'cardio', equipment: 'poids du corps', difficulty: 'intermédiaire', description: 'Les burpees sont l\'exercice fonctionnel le plus complet. Ils combinent force, cardio et explosivité en sollicitant l\'ensemble du corps. Très intenses, parfaits pour les séances HIIT.', instructions: ['Debout, descendez en squat, mains au sol', 'Sautez les pieds en arrière en position de pompe', 'Effectuez une pompe (optionnel)', 'Ramenez les pieds vers les mains d\'un saut', 'Sautez vers le haut les bras en l\'air'], secondaryMuscles: [] },
    { id: 'o_cd7', name: 'HIIT tapis de course', target: 'cardio', equipment: 'machine', difficulty: 'intermédiaire', description: 'Le HIIT sur tapis alterne sprints et récupérations actives. Cette méthode brûle plus de calories que le cardio continu et continue à bruler des calories après la séance (afterburn effect).', instructions: ['Échauffement 5 min à rythme modéré', 'Sprint 20-30 secondes à 80-90% de l\'intensité max', 'Récupération 40-60 secondes à rythme lent', 'Répétez 8-10 fois', 'Récupération 5 min en marchant'], secondaryMuscles: [] },
  ],
};

const exerciseCache: Record<string, Exercise[]> = {};

function capitalize(str: string) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}



// Composant GIF — GIF local en priorité, fallback emoji
function GifImage({ exerciseId, gifUrl, style, size = 'small' }: {
  exerciseId?: string;
  gifUrl?: string;
  style: any;
  size?: 'small' | 'large';
}) {
  const gifKey = exerciseId ? EXERCISE_TO_GIF[exerciseId] : null;
  const localGif = gifKey ? GIF_MAP[gifKey] : null;
  const source = localGif ?? (gifUrl ? { uri: gifUrl } : null);

  if (!source) {
    return (
      <View style={[style, { backgroundColor: '#F8F8F8', justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: size === 'large' ? 40 : 22 }}>💪</Text>
      </View>
    );
  }
  return (
    <Image
      source={source}
      style={[style, { backgroundColor: '#FFFFFF' }]}
      resizeMode="contain"
    />
  );
}

// ─── EXERCISE DETAIL MODAL ───────────────────
function ExerciseDetailModal({
  exercise, onAdd, onClose,
}: {
  exercise: Exercise;
  onAdd: (name: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <View style={detail.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={{ color: ACC, fontSize: 14 }}>← Retour</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <View style={detail.gifContainer}>
            <GifImage exerciseId={exercise.id} gifUrl={exercise.gifUrl} style={detail.gif} size="large" />
          </View>

          <Text style={detail.exName}>{capitalize(exercise.name)}</Text>

          <View style={detail.tags}>
            <View style={detail.tag}>
              <Text style={detail.tagLabel}>MUSCLE</Text>
              <Text style={detail.tagValue}>{capitalize(exercise.target)}</Text>
            </View>
            <View style={detail.tag}>
              <Text style={detail.tagLabel}>ÉQUIP.</Text>
              <Text style={detail.tagValue}>{capitalize(exercise.equipment)}</Text>
            </View>
            <View style={detail.tag}>
              <Text style={detail.tagLabel}>NIVEAU</Text>
              <Text style={detail.tagValue}>{capitalize(exercise.difficulty ?? '—')}</Text>
            </View>
          </View>

          {exercise.description && (
            <View style={detail.section}>
              <Text style={detail.sectionTitle}>📋 Description</Text>
              <Text style={detail.sectionText}>{exercise.description}</Text>
            </View>
          )}

          {(exercise.instructions?.length ?? 0) > 0 && (
            <View style={detail.section}>
              <Text style={detail.sectionTitle}>📌 Instructions</Text>
              {exercise.instructions!.map((step, i) => (
                <View key={i} style={detail.stepRow}>
                  <View style={detail.stepNum}>
                    <Text style={detail.stepNumText}>{i + 1}</Text>
                  </View>
                  <Text style={detail.stepText}>{step}</Text>
                </View>
              ))}
            </View>
          )}

          {(exercise.secondaryMuscles?.length ?? 0) > 0 && (
            <View style={detail.section}>
              <Text style={detail.sectionTitle}>💪 Muscles secondaires</Text>
              <Text style={detail.sectionText}>
                {exercise.secondaryMuscles!.map(capitalize).join(', ')}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={detail.addBtn}
            onPress={() => { onAdd(capitalize(exercise.name)); onClose(); }}
          >
            <Text style={detail.addBtnText}>+ Ajouter à la séance</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── EXERCISE PICKER MODAL ───────────────────
export function ExercisePicker({
  onSelect, onClose,
}: {
  onSelect: (name: string) => void;
  onClose: () => void;
}) {
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  async function fetchExercises(bodyPart: string) {
    if (exerciseCache[bodyPart]) {
      setExercises(exerciseCache[bodyPart]);
      return;
    }
    setLoading(true);
    try {
      // Données locales directement
      throw new Error('Use offline data');
    } catch (e) {
      console.log('ExerciseDB error — using offline data:', e);
      // Fallback offline
      const offline = OFFLINE_EXERCISES[bodyPart] ?? [];
      const mapped = offline.map(o => ({
        id: o.id, name: o.name, bodyPart, target: o.target,
        equipment: o.equipment,
        difficulty: o.difficulty ?? 'intermédiaire',
        description: o.description,
        instructions: o.instructions,
        secondaryMuscles: o.secondaryMuscles,
      }));
      exerciseCache[bodyPart] = mapped;
      setExercises(mapped);
    }
    setLoading(false);
  }

  function selectMuscle(id: string) {
    setSelectedMuscle(id);
    setSearch('');
    fetchExercises(id);
  }

  const filtered = exercises.filter(ex =>
    ex.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <View style={picker.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={{ color: ACC, fontSize: 14 }}>Fermer</Text>
          </TouchableOpacity>
          <Text style={picker.title}>EXERCICES</Text>
          <View style={{ width: 60 }} />
        </View>

        {!selectedMuscle ? (
          <ScrollView contentContainerStyle={picker.muscleGrid}>
            <Text style={picker.subtitle}>Choisis un groupe musculaire</Text>
            <View style={picker.grid}>
              {MUSCLE_GROUPS.map(m => (
                <TouchableOpacity
                  key={m.id}
                  style={picker.muscleCard}
                  onPress={() => selectMuscle(m.id)}
                >
                  <Text style={picker.muscleEmoji}>{m.emoji}</Text>
                  <Text style={picker.muscleLabel}>{m.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        ) : (
          <View style={{ flex: 1 }}>
            <View style={picker.searchRow}>
              <TouchableOpacity onPress={() => { setSelectedMuscle(null); setExercises([]); }}>
                <Text style={{ color: ACC, fontSize: 13, marginRight: 12 }}>← Retour</Text>
              </TouchableOpacity>
              <TextInput
                style={picker.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="Rechercher..."
                placeholderTextColor={C.dim}
                autoCorrect={false}
              />
            </View>

            {loading ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator color={C.gold} size="large" />
                <Text style={{ color: C.dim, marginTop: 12, fontSize: 13 }}>
                  Chargement des exercices...
                </Text>
              </View>
            ) : (
              <FlatList
                data={filtered}
                keyExtractor={item => item.id}
                contentContainerStyle={{ padding: 16 }}
                windowSize={3}
                initialNumToRender={6}
                maxToRenderPerBatch={6}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={picker.exRow}
                    onPress={() => setSelectedExercise(item)}
                  >
                    <GifImage exerciseId={item.id} gifUrl={item.gifUrl} style={picker.exThumb} />
                    <View style={{ flex: 1 }}>
                      <Text style={picker.exName}>{capitalize(item.name)}</Text>
                      <Text style={picker.exMeta}>
                        {capitalize(item.target)} · {capitalize(item.equipment)}
                      </Text>
                    </View>
                    <Text style={{ color: ACC, fontSize: 18 }}>›</Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        )}
      </View>

      {selectedExercise && (
        <ExerciseDetailModal
          exercise={selectedExercise}
          onAdd={onSelect}
          onClose={() => setSelectedExercise(null)}
        />
      )}
    </Modal>
  );
}

const picker = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderBottomWidth: 1, borderBottomColor: ACCD,
  },
  title: { fontFamily: 'Cinzel', fontSize: 16, color: ACCB, letterSpacing: 2 },
  subtitle: { fontSize: 13, color: C.dim, textAlign: 'center', marginBottom: 20 },
  muscleGrid: { padding: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  muscleCard: {
    width: '46%', backgroundColor: C.s2, borderRadius: 14,
    padding: 18, alignItems: 'center', borderWidth: 1, borderColor: ACCD,
  },
  muscleEmoji: { fontSize: 32, marginBottom: 8 },
  muscleLabel: { fontSize: 13, color: C.text, fontWeight: '600' },
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, borderBottomWidth: 1, borderBottomColor: ACCD,
  },
  searchInput: {
    flex: 1, backgroundColor: C.s2, borderRadius: 10, padding: 10,
    color: C.text, fontSize: 14, borderWidth: 1, borderColor: ACCD,
  },
  exRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.s2, borderRadius: 12, padding: 12,
    marginBottom: 10, borderWidth: 1, borderColor: ACCD,
  },
  exThumb: { width: 60, height: 60, borderRadius: 8, backgroundColor: C.s3 },
  exName: { fontSize: 14, color: ACCB, fontWeight: '600' },
  exMeta: { fontSize: 11, color: C.dim, marginTop: 2 },
});

const detail = StyleSheet.create({
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: ACCD },
  gifContainer: {
    backgroundColor: C.s2, borderRadius: 16, overflow: 'hidden',
    marginBottom: 20, height: 280,
  },
  gif: { width: '100%', height: 280 },
  exName: {
    fontFamily: 'Cinzel', fontSize: 20, color: ACCB,
    letterSpacing: 1, marginBottom: 16,
  },
  tags: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  tag: {
    flex: 1, backgroundColor: C.s2, borderRadius: 10,
    padding: 12, borderWidth: 1, borderColor: ACCD, alignItems: 'center',
  },
  tagLabel: { fontSize: 9, color: ACC, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 },
  tagValue: { fontSize: 11, color: C.text, fontWeight: '600', textAlign: 'center' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 13, color: ACC, fontWeight: '700', marginBottom: 10 },
  sectionText: { fontSize: 13, color: C.dim, lineHeight: 20 },
  stepRow: { flexDirection: 'row', gap: 10, marginBottom: 10, alignItems: 'flex-start' },
  stepNum: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: ACCD, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  stepNumText: { color: ACCB, fontSize: 11, fontWeight: '700' },
  stepText: { flex: 1, fontSize: 13, color: C.dim, lineHeight: 20 },
  addBtn: { backgroundColor: ACC, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 10 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 15, letterSpacing: 1 },
});
