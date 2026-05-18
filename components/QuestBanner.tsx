// components/QuestBanner.tsx
import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { C } from '@/constants/colors';
import { type Quest } from '@/constants/quests';

type Props = {
  quest: Quest;
  onDismiss: () => void;
};

export default function QuestBanner({ quest, onDismiss }: Props) {
  const slideAnim = useRef(new Animated.Value(-120)).current;
  const opacAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    // Entrée
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, tension: 70, friction: 12, useNativeDriver: true }),
      Animated.timing(opacAnim,  { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 80, friction: 10, useNativeDriver: true }),
    ]).start();

    // Auto-dismiss après 4.5s
    const t = setTimeout(dismiss, 4500);
    return () => clearTimeout(t);
  }, []);

  function dismiss() {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: -120, duration: 350, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      Animated.timing(opacAnim,  { toValue: 0,    duration: 300, useNativeDriver: true }),
    ]).start(onDismiss);
  }

  return (
    <Animated.View style={[
      styles.banner,
      {
        transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
        opacity: opacAnim,
        borderColor: quest.color + '66',
        shadowColor: quest.color,
      },
    ]}>
      {/* Ligne colorée en haut */}
      <View style={[styles.topLine, { backgroundColor: quest.color }]} />

      <View style={styles.row}>
        {/* Icône */}
        <View style={[styles.iconBox, { borderColor: quest.color + '55', backgroundColor: quest.color + '15' }]}>
          <Text style={[styles.icon, { color: quest.color }]}>{quest.icon}</Text>
        </View>

        {/* Contenu */}
        <View style={{ flex: 1 }}>
          <View style={styles.topRow}>
            <Text style={[styles.label, { color: quest.color }]}>QUÊTE ACCOMPLIE</Text>
            <Text style={[styles.xp, { color: quest.color }]}>+{quest.xp} XP</Text>
          </View>
          <Text style={styles.title}>{quest.title}</Text>
          <Text style={styles.phrase}>{quest.phrase}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 54,
    left: 16,
    right: 16,
    zIndex: 998,
    backgroundColor: '#0A0800',
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  topLine: {
    height: 2,
    width: '100%',
    opacity: 0.8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
  },
  iconBox: {
    width: 44, height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontFamily: 'Cinzel',
    fontSize: 20,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  label: {
    fontSize: 8,
    letterSpacing: 2,
    fontWeight: '700',
  },
  xp: {
    fontFamily: 'SpaceMono',
    fontSize: 13,
    fontWeight: '700',
  },
  title: {
    fontFamily: 'Cinzel',
    fontSize: 14,
    color: '#E2DDD5',
    letterSpacing: 1,
    marginBottom: 3,
  },
  phrase: {
    fontSize: 11,
    color: '#545048',
    fontStyle: 'italic',
    lineHeight: 16,
  },
});
