import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { C } from '@/constants/colors';
import { getRank, getXPProgress, getXPNeeded, getNextMilestone, RANKS } from '@/constants/rpg';

const FEMALE_RANK_NAMES: Record<string, string> = {
  'INITIÉ':     'INITIÉE',
  'GUERRIER':   'GUERRIÈRE',
  'CONQUÉRANT': 'CONQUÉRANTE',
  'CHAMPION':   'CHAMPIONNE',
  'MAÎTRE':     'MAÎTRESSE',
};

function rankDisplayName(name: string, gender: string): string {
  return gender === 'female' ? (FEMALE_RANK_NAMES[name] ?? name) : name;
}

export function XPBar({ totalXP, style, gender = 'male' }: { totalXP: number; style?: any; gender?: string }) {
  const rank = getRank(totalXP);
  const progress = getXPProgress(totalXP);
  const xpNeeded = getXPNeeded(totalXP);
  const animWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animWidth, {
      toValue: progress,
      duration: 1200,
      useNativeDriver: false,
    }).start();
  }, [totalXP]);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.rankName, { color: rank.color }]}>{rankDisplayName(rank.name, gender)}</Text>
          <Text style={styles.level}>Niveau {rank.level}</Text>
        </View>
        <View style={styles.xpBadge}>
          <Text style={[styles.xpTotal, { color: rank.color }]}>{totalXP} XP</Text>
          {rank.level < 100 && (
            <Text style={styles.xpNeeded}>{xpNeeded} XP restants</Text>
          )}
        </View>
      </View>

      {/* Barre XP */}
      <View style={styles.barBg}>
        <Animated.View
          style={[
            styles.barFill,
            {
              backgroundColor: rank.color,
              width: animWidth.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
        {/* Segments */}
        {[0.25, 0.5, 0.75].map(seg => (
          <View key={seg} style={[styles.segment, { left: `${seg * 100}%` as any }]} />
        ))}
      </View>

      {/* Rang précédent → suivant */}
      <View style={styles.rankRow}>
        <Text style={[styles.rankMin, { color: rank.color + '88' }]}>
          {rank.level > 1 ? RANKS[rank.level - 2]?.name : ''}
        </Text>
        {rank.level < 100 && (
          <Text style={[styles.rankMax, { color: rank.color + '88' }]}>
            {RANKS[rank.level]?.name}
          </Text>
        )}
      </View>
    </View>
  );
}

export function RankBadge({ totalXP, size = 'normal', gender = 'male' }: { totalXP: number; size?: 'small' | 'normal' | 'large'; gender?: string }) {
  const rank = getRank(totalXP);
  const isLarge = size === 'large';
  const isSmall = size === 'small';

  return (
    <View style={[
      styles.badge,
      { borderColor: rank.color + '66', backgroundColor: rank.color + '11' },
      isLarge && styles.badgeLarge,
      isSmall && styles.badgeSmall,
    ]}>
      <Text style={[styles.badgeText, { color: rank.color }, isLarge && styles.badgeTextLarge, isSmall && styles.badgeTextSmall]}>
        {rankDisplayName(rank.name, gender)}
      </Text>
      <Text style={[styles.badgeLevel, isLarge && { fontSize: 11 }, isSmall && { fontSize: 8 }]}>
        LVL {rank.level}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  rankName: { fontFamily: 'Cinzel', fontSize: 18, letterSpacing: 2 },
  level: { fontSize: 11, color: C.dim, marginTop: 2, letterSpacing: 1 },
  xpBadge: { alignItems: 'flex-end' },
  xpTotal: { fontFamily: 'SpaceMono', fontSize: 16, fontWeight: '700' },
  xpNeeded: { fontSize: 10, color: C.dim, marginTop: 2 },
  barBg: {
    height: 8, backgroundColor: C.s3, borderRadius: 4,
    overflow: 'hidden', position: 'relative',
  },
  barFill: { height: '100%', borderRadius: 4 },
  segment: {
    position: 'absolute', top: 0, bottom: 0,
    width: 1, backgroundColor: C.bg + '88',
  },
  rankRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  rankMin: { fontSize: 9, letterSpacing: 1, textTransform: 'uppercase' },
  rankMax: { fontSize: 9, letterSpacing: 1, textTransform: 'uppercase' },

  // Badge
  badge: {
    borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
    alignItems: 'center', flexDirection: 'row', gap: 6,
  },
  badgeLarge: { paddingHorizontal: 16, paddingVertical: 8 },
  badgeSmall: { paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontFamily: 'Cinzel', fontSize: 12, letterSpacing: 2 },
  badgeTextLarge: { fontSize: 16 },
  badgeTextSmall: { fontSize: 9 },
  badgeLevel: { fontSize: 9, color: C.dim, letterSpacing: 1 },
});
