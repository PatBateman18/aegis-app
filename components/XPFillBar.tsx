// components/XPFillBar.tsx
// Version "bar only" de XPBarAnimated : à utiliser quand tu as déjà ta propre carte
// (badge de niveau, textes NIVEAU / XP DU JOUR...) et que tu veux juste remplacer
// la barre de progression plate par la version animée (remplissage fluide,
// méandre grec qui défile, sheen, floater "+XP", et un petit burst au level-up).
//
// Usage :
// <XPFillBar totalXP={totalXP} level={rank.level} progress={xpProgress} color={GOLD} height={4} style={{ flex: 1 }} />
//
// - totalXP  : XP total actuel (sert à détecter les gains → floater "+XP")
// - level    : niveau actuel calculé par toi (rank.level) → sert à détecter le level-up
// - progress : 0 → 1, le remplissage de la barre (tu gardes le contrôle du calcul)
// - color    : couleur de remplissage (ex: GOLD)
// - height   : épaisseur de la barre (défaut 10, mets ce que tu veux, ex: 4 ou 6)

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { C } from '@/constants/colors';

// ─── Motif : méandre grec (répété pour couvrir 2x la largeur, pour driver le drift) ───
function buildMeander(width: number, cell: number, height: number) {
  const s = cell / 30, hs = height / 30;
  const n = Math.ceil(width / cell) + 1;
  const parts: string[] = [];
  for (let i = 0; i < n; i++) {
    const x = i * cell;
    parts.push(
      `M${(x + 4 * s).toFixed(1)},${(5 * hs).toFixed(1)} H${(x + 26 * s).toFixed(1)} V${(26 * hs).toFixed(1)} H${(x + 9 * s).toFixed(1)} V${(12 * hs).toFixed(1)} H${(x + 19 * s).toFixed(1)} V${(19 * hs).toFixed(1)} H${(x + 13 * s).toFixed(1)}`
    );
  }
  return parts.join(' ');
}

const MEANDER_CELL = 16.6;

type Particle = { id: number; angle: number; dist: number; size: number; color: string };
function makeParticles(n: number): Particle[] {
  return Array.from({ length: n }, (_, i) => {
    const angle = (Math.PI * 2 * i) / n + Math.random() * 0.3;
    return {
      id: i,
      angle,
      dist: 28 + Math.random() * 22,
      size: 2 + Math.random() * 3,
      color: Math.random() > 0.5 ? C.goldBright : C.gold,
    };
  });
}

export function XPFillBar({
  totalXP,
  level,
  progress,
  color,
  height = 10,
  style,
}: {
  totalXP: number;
  level: number;
  progress: number;
  color: string;
  height?: number;
  style?: any;
}) {
  const meanderD = useMemo(() => buildMeander(900, MEANDER_CELL, height), [height]);

  const [gain, setGain] = useState<{ amt: number; key: number } | null>(null);
  const [pillLevel, setPillLevel] = useState<number | null>(null);
  const [showBurst, setShowBurst] = useState(false);

  const progAnim = useRef(new Animated.Value(progress)).current;
  const prevTotalRef = useRef(totalXP);
  const prevLevelRef = useRef(level);

  const flashOpacity = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0.35)).current;
  const ringOpacity = useRef(new Animated.Value(0.8)).current;
  const gainOpacity = useRef(new Animated.Value(0)).current;
  const gainY = useRef(new Animated.Value(6)).current;
  const pillOpacity = useRef(new Animated.Value(0)).current;
  const pillY = useRef(new Animated.Value(8)).current;
  const sheenX = useRef(new Animated.Value(-60)).current;
  const meanderX = useRef(new Animated.Value(0)).current;

  const particles = useMemo(() => makeParticles(12), []);
  const particleAnims = useRef(particles.map(() => new Animated.Value(0))).current;

  // boucles perpétuelles : sheen + drift du méandre
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(sheenX, { toValue: 420, duration: 1600, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(sheenX, { toValue: -60, duration: 0, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.timing(meanderX, { toValue: -MEANDER_CELL, duration: 3000, easing: Easing.linear, useNativeDriver: true })
    ).start();
  }, []);

  // réagit aux changements de progress / totalXP (gain d'XP réel)
  useEffect(() => {
    const delta = totalXP - prevTotalRef.current;
    prevTotalRef.current = totalXP;

    if (delta > 0) {
      setGain({ amt: delta, key: Date.now() });
      gainOpacity.setValue(0);
      gainY.setValue(6);
      Animated.sequence([
        Animated.timing(gainOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.delay(600),
        Animated.parallel([
          Animated.timing(gainOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.timing(gainY, { toValue: -18, duration: 300, useNativeDriver: true }),
        ]),
      ]).start(() => setGain(null));
    }

    const dur = Math.min(2400, 650 + Math.abs(delta) * 1.6);
    Animated.timing(progAnim, {
      toValue: Math.max(0, Math.min(1, progress)),
      duration: dur,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalXP, progress]);

  // détecte le level-up via la prop `level`
  useEffect(() => {
    if (level > prevLevelRef.current) {
      prevLevelRef.current = level;
      triggerLevelUp(level);
    } else if (level < prevLevelRef.current) {
      prevLevelRef.current = level;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level]);

  function triggerLevelUp(lvl: number) {
    setPillLevel(lvl);
    setShowBurst(true);
    flashOpacity.setValue(0);
    ringScale.setValue(0.35);
    ringOpacity.setValue(0.8);
    pillOpacity.setValue(0);
    pillY.setValue(8);
    particleAnims.forEach(a => a.setValue(0));

    Animated.sequence([
      Animated.timing(flashOpacity, { toValue: 0.85, duration: 210, useNativeDriver: true }),
      Animated.timing(flashOpacity, { toValue: 0, duration: 490, useNativeDriver: true }),
    ]).start();

    Animated.parallel([
      Animated.timing(ringScale, { toValue: 2.6, duration: 800, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(ringOpacity, { toValue: 0, duration: 800, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start(() => setShowBurst(false));

    Animated.parallel(
      particleAnims.map(a => Animated.timing(a, { toValue: 1, duration: 750, easing: Easing.out(Easing.quad), useNativeDriver: true }))
    ).start();

    Animated.sequence([
      Animated.parallel([
        Animated.timing(pillOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(pillY, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]),
      Animated.delay(900),
      Animated.parallel([
        Animated.timing(pillOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(pillY, { toValue: -14, duration: 300, useNativeDriver: true }),
      ]),
    ]).start(() => setPillLevel(null));
  }

  const widthPct = progAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={[{ position: 'relative' }, style]}>
      {gain && (
        <Animated.Text style={[styles.gainText, { color, opacity: gainOpacity, transform: [{ translateY: gainY }] }]}>
          +{gain.amt} XP
        </Animated.Text>
      )}
      {pillLevel != null && (
        <Animated.View style={[styles.pill, { backgroundColor: color, opacity: pillOpacity, transform: [{ translateY: pillY }] }]}>
          <Text style={styles.pillText}>NIVEAU {pillLevel}</Text>
        </Animated.View>
      )}

      <View style={[styles.barBg, { height, borderRadius: height / 2 }]}>
        <Animated.View style={[styles.barFill, { backgroundColor: color, borderRadius: height / 2, width: widthPct }]}>
          <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX: meanderX }] }]}>
            <Svg width={900} height={height}>
              <Path d={meanderD} stroke="rgba(24,17,4,0.5)" strokeWidth={Math.max(1, height * 0.13)} fill="none" />
            </Svg>
          </Animated.View>
          <Animated.View style={[styles.sheen, { transform: [{ translateX: sheenX }] }]} />
        </Animated.View>
        {showBurst && <Animated.View style={[styles.flash, { opacity: flashOpacity, borderRadius: height / 2 }]} />}
      </View>

      {showBurst && (
        <View pointerEvents="none" style={[styles.burstWrap, { top: height / 2 }]}>
          <Animated.View style={[styles.ring, { borderColor: color + 'b3', opacity: ringOpacity, transform: [{ scale: ringScale }] }]} />
          {particles.map((p, i) => {
            const t = particleAnims[i];
            const tx = t.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(p.angle) * p.dist] });
            const ty = t.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(p.angle) * p.dist - 8] });
            const op = t.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 1, 0] });
            return (
              <Animated.View
                key={p.id}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: 0,
                  width: p.size,
                  height: p.size,
                  borderRadius: p.size / 2,
                  backgroundColor: p.color,
                  opacity: op,
                  transform: [{ translateX: tx }, { translateY: ty }],
                }}
              />
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  barBg: {
    backgroundColor: '#1c1a16',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.14)',
  },
  barFill: { height: '100%', overflow: 'hidden' },
  sheen: { position: 'absolute', top: 0, bottom: 0, width: 50, backgroundColor: 'rgba(255,255,255,0.35)' },
  flash: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#fff' },

  gainText: {
    position: 'absolute', right: 0, top: -22,
    fontFamily: 'SpaceMono', fontWeight: '700', fontSize: 13,
  },
  pill: {
    position: 'absolute', left: '38%', top: -28,
    paddingHorizontal: 14, paddingVertical: 4, borderRadius: 20,
  },
  pillText: { fontFamily: 'Cinzel', fontWeight: '700', fontSize: 12, letterSpacing: 2, color: '#0d0b09' },

  burstWrap: { position: 'absolute', left: 0, right: 0, height: 0 },
  ring: {
    position: 'absolute', left: '50%', top: 0, width: 40, height: 40, marginLeft: -20, marginTop: -20,
    borderRadius: 20, borderWidth: 1.5,
  },
});
