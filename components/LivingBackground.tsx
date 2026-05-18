// components/LivingBackground.tsx
// Background vivant AEGIS — particules dorées flottantes + glow pulsant
// Drop-in : <LivingBackground intensity={disciplineLevel} rankColor={rank.color} />
// Tout useNativeDriver: true → 0 impact sur le JS thread

import { useEffect, useRef, useMemo } from 'react';
import { View, Animated, Easing, Dimensions, StyleSheet } from 'react-native';
import { C } from '@/constants/colors';

const { width, height } = Dimensions.get('window');

// ─── Config ───────────────────────────────────────────────────────────────────
const PARTICLE_COUNT = 14;   // peu mais qualitatifs
const GLOW_COUNT     = 3;    // halos de fond

// ─── Particule flottante ──────────────────────────────────────────────────────
interface ParticleProps {
  x: number;          // position X fixe
  startY: number;     // Y de départ (bas → haut)
  size: number;
  duration: number;
  delay: number;
  drift: number;      // dérive horizontale
  color: string;
  opacity: number;
}

function Particle({ x, startY, size, duration, delay, drift, color, opacity }: ParticleProps) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {
          toValue: 1,
          duration,
          easing: Easing.out(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const translateY = anim.interpolate({
    inputRange:  [0, 1],
    outputRange: [startY, startY - height * 0.65],
  });
  const translateX = anim.interpolate({
    inputRange:  [0, 0.5, 1],
    outputRange: [0, drift * 0.6, drift],
  });
  const particleOpacity = anim.interpolate({
    inputRange:  [0, 0.08, 0.75, 1],
    outputRange: [0, opacity, opacity * 0.6, 0],
  });
  const scale = anim.interpolate({
    inputRange:  [0, 0.1, 0.9, 1],
    outputRange: [0, 1, 0.7, 0],
  });

  return (
    <Animated.View style={{
      position: 'absolute',
      left: x,
      top: 0,    // translateY gère la position
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: color,
      opacity: particleOpacity,
      transform: [{ translateY }, { translateX }, { scale }],
    }} />
  );
}

// ─── Halo de fond pulsant ─────────────────────────────────────────────────────
interface GlowBlobProps {
  x: number;
  y: number;
  size: number;
  color: string;
  duration: number;
  delay: number;
}

function GlowBlob({ x, y, size, color, duration, delay }: GlowBlobProps) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const glowOpacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.02, 0.07] });
  const glowScale   = anim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.15] });

  return (
    <Animated.View style={{
      position: 'absolute',
      left: x - size / 2,
      top:  y - size / 2,
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: color,
      opacity: glowOpacity,
      transform: [{ scale: glowScale }],
    }} />
  );
}

// ─── Barre de scan horizontale ────────────────────────────────────────────────
function ScanLine() {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 5000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.delay(3000),
        Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [-4, height * 0.9] });
  const opacity    = anim.interpolate({ inputRange: [0, 0.05, 0.95, 1], outputRange: [0, 0.12, 0.12, 0] });

  return (
    <Animated.View style={{
      position: 'absolute',
      left: 0, right: 0,
      height: 1,
      backgroundColor: C.gold,
      opacity,
      transform: [{ translateY }],
    }} />
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
interface Props {
  intensity?: number;     // 0-3 selon disciplineLevel
  rankColor?: string;     // couleur du rang actuel
  heroHeight?: number;    // limiter la zone (optionnel)
}

export default function LivingBackground({ intensity = 1, rankColor = C.gold, heroHeight }: Props) {
  // Génère les particules de façon déterministe
  const particles = useMemo<ParticleProps[]>(() => {
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
      const seed  = (i * 137.508 + 42) % 1;   // pseudo-random déterministe
      const seed2 = (i * 73.1 + 17)  % 1;
      const seed3 = (i * 211.3 + 5)  % 1;
      const seed4 = (i * 59.7 + 31)  % 1;

      return {
        x:        width * (0.05 + seed  * 0.9),
        startY:   height * 0.15 + seed2 * height * 0.7,
        size:     1.5 + seed3 * 3,
        duration: 7000 + seed4 * 6000,
        delay:    i * 600,
        drift:    (seed  - 0.5) * 60,
        // Alterne entre or et couleur du rang
        color:    i % 3 === 0 ? rankColor : i % 3 === 1 ? C.gold : '#FFFFFF',
        opacity:  0.25 + seed2 * 0.4 * Math.min(1, (intensity + 1) / 3),
      };
    });
  }, [rankColor, intensity]);

  const globs = useMemo<GlowBlobProps[]>(() => [
    { x: width * 0.25, y: height * 0.15, size: 260, color: C.gold,     duration: 4000, delay: 0    },
    { x: width * 0.75, y: height * 0.35, size: 200, color: rankColor,  duration: 5500, delay: 1800 },
    { x: width * 0.5,  y: height * 0.55, size: 300, color: C.gold,     duration: 3500, delay: 900  },
  ], [rankColor]);

  const containerStyle = heroHeight
    ? [styles.container, { height: heroHeight }]
    : [styles.container];

  return (
    <View style={containerStyle} pointerEvents="none">
      {/* Halos */}
      {globs.map((g, i) => <GlowBlob key={`g${i}`} {...g} />)}

      {/* Particules */}
      {particles.map((p, i) => <Particle key={`p${i}`} {...p} />)}

      {/* Scan line subtile */}
      {intensity >= 2 && <ScanLine />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    pointerEvents: 'none',
  },
});
