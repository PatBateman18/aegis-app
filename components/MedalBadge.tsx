// components/MedalBadge.tsx
import { View, Image, StyleSheet } from 'react-native';

// Ordre croissant de difficulté — correspond aux STREAK_MILESTONES
const MEDALS = [
  require('@/assets/medals/medal_bronze.png'),     // idx 0
  require('@/assets/medals/medal_silver.png'),     // idx 1
  require('@/assets/medals/medal_gold.png'),       // idx 2
  require('@/assets/medals/medal_platinum.png'),   // idx 3
  require('@/assets/medals/medal_conqueror.png'),  // idx 4
  require('@/assets/medals/medal_diamond.png'),    // idx 5
  require('@/assets/medals/medal_centurion.png'),  // idx 6
  require('@/assets/medals/medal_legend.png'),     // idx 7
];

const MEDALS_FEMALE = [
  require('@/assets/medals/medal_bronze_femme.png'),     // idx 0
  require('@/assets/medals/medal_silver_femme.png'),     // idx 1
  require('@/assets/medals/medal_gold_femme.png'),       // idx 2
  require('@/assets/medals/medal_platinum_femme.png'),   // idx 3
  require('@/assets/medals/medal_conqueror_femme.png'),  // idx 4
  require('@/assets/medals/medal_diamond_femme.png'),    // idx 5
  require('@/assets/medals/medal_centurion_femme.png'),  // idx 6
  require('@/assets/medals/medal_legend_femme.png'),     // idx 7
];

// Ajustements visuels individuels si une image est décalée
const ADJUSTMENTS: Record<number, { translateX?: number; translateY?: number; scale?: number }> = {
  3: { translateX: -4 },
  5: { translateX: -4 },
  6: { translateX: -4 },
};

type Props = {
  milestoneIndex: number;
  achieved: boolean;
  size?: number;
  gender?: string;
};

export default function MedalBadge({ milestoneIndex, achieved, size = 56, gender = 'male' }: Props) {
  const pool   = gender === 'female' ? MEDALS_FEMALE : MEDALS;
  const source = pool[Math.min(milestoneIndex, pool.length - 1)];
  const adj    = ADJUSTMENTS[milestoneIndex] ?? {};

  return (
    <View style={[
      styles.container,
      { width: size, height: size * 1.2 },
      !achieved && styles.locked,
    ]}>
      <Image
        source={source}
        style={[
          { width: size, height: size * 1.2 },
          (adj.translateX || adj.translateY || adj.scale) ? {
            transform: [
              ...(adj.translateX ? [{ translateX: adj.translateX }] : []),
              ...(adj.translateY ? [{ translateY: adj.translateY }] : []),
              ...(adj.scale      ? [{ scale: adj.scale }]           : []),
            ],
          } : {},
        ]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  locked:    { opacity: 0.25 },
});
