// components/PerfectDayCelebration.tsx
import { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing, Dimensions, StyleSheet } from 'react-native';
import { C } from '@/constants/colors';

const { width, height } = Dimensions.get('window');

const COLORS = [C.goldBright, C.gold, '#FFFFFF', C.green, C.goldDim, '#F5E090'];
const PARTICLE_COUNT = 48;

// ─── Confetti particle ────────────────────────────────────────────────────────
function Confetti({ index }: { index: number }) {
  const anim  = useRef(new Animated.Value(0)).current;
  const size  = 4 + Math.random() * 6;
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  const startX = width * 0.2 + Math.random() * width * 0.6; // zone centrale
  const angle  = (Math.random() - 0.5) * Math.PI * 1.4;     // éventail large
  const speed  = 280 + Math.random() * 220;
  const dx     = Math.sin(angle) * speed;
  const dy     = -(160 + Math.random() * 300);               // vers le haut
  const delay  = Math.random() * 300;
  const isRect = Math.random() > 0.5;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(anim, {
        toValue: 1,
        duration: 900 + Math.random() * 400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{
      position: 'absolute',
      bottom: height * 0.35,
      left: startX,
      width: isRect ? size * 0.6 : size,
      height: isRect ? size * 1.6 : size,
      borderRadius: isRect ? 1 : size / 2,
      backgroundColor: color,
      opacity: anim.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 1, 0] }),
      transform: [
        { translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [0, dx] }) },
        { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, dy] }) },
        { rotate:     anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${(Math.random() - 0.5) * 720}deg`] }) },
        { scale:      anim.interpolate({ inputRange: [0, 0.1, 1], outputRange: [0, 1, 0.4] }) },
      ],
    }} />
  );
}

// ─── Banner "JOUR PARFAIT" ────────────────────────────────────────────────────
function PerfectBanner({ visible }: { visible: boolean }) {
  const slideAnim = useRef(new Animated.Value(-120)).current;
  const opacAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
      Animated.timing(opacAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();

    // Auto-hide après 2.8s
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: -120, duration: 400, useNativeDriver: true }),
        Animated.timing(opacAnim,  { toValue: 0,    duration: 400, useNativeDriver: true }),
      ]).start();
    }, 2800);

    return () => clearTimeout(t);
  }, [visible]);

  return (
    <Animated.View style={[
      styles.banner,
      { transform: [{ translateY: slideAnim }], opacity: opacAnim },
    ]}>
      <Text style={styles.bannerEmoji}>✦</Text>
      <View>
        <Text style={styles.bannerTitle}>JOUR PARFAIT</Text>
        <Text style={styles.bannerSub}>Toutes les habitudes validées</Text>
      </View>
      <Text style={styles.bannerScore}>100%</Text>
    </Animated.View>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
type Props = { trigger: boolean };

export default function PerfectDayCelebration({ trigger }: Props) {
  const particles = useRef(
    Array.from({ length: PARTICLE_COUNT }, (_, i) => i)
  ).current;

  if (!trigger) return null;

  return (
    <View style={styles.overlay} pointerEvents="none">
      <PerfectBanner visible={trigger} />
      {particles.map(i => <Confetti key={i} index={i} />)}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 998,
  },
  banner: {
    position: 'absolute',
    top: 54,
    left: 16,
    right: 16,
    backgroundColor: '#0E0B00',
    borderWidth: 1,
    borderColor: C.gold,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  bannerEmoji: {
    fontSize: 22,
    color: C.goldBright,
  },
  bannerTitle: {
    fontFamily: 'Cinzel',
    fontSize: 15,
    color: C.goldBright,
    letterSpacing: 2,
  },
  bannerSub: {
    fontSize: 11,
    color: C.dim,
    marginTop: 2,
  },
  bannerScore: {
    fontFamily: 'SpaceMono',
    fontSize: 18,
    color: C.green,
    marginLeft: 'auto',
  },
});
