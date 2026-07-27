// components/XPBarAnimated.tsx
// Version animée de XPBar : remplissage fluide, compteur qui grimpe, floater "+XP",
// méandre grec dans le remplissage, lauriers autour du rang, et un débordement
// (flash + anneau + particules + pastille "NIVEAU x") quand on franchit un palier.
//
// Dépendances déjà présentes dans le projet : react-native-svg, expo-font (Cinzel).
// Usage : <XPBarAnimated totalXP={profile.totalXP} gender={profile.gender} />
// (mêmes props que XPBar — remplace-le à l'identique, ou garde les deux le temps de comparer)

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { C } from '@/constants/colors';
import { getRank, getXPProgress, getXPNeeded } from '@/constants/rpg';

const FEMALE_RANK_NAMES: Record<string, string> = {
  'NOVICE':     'NOVICE',
  'INITIÉ':     'INITIÉE',
  'DISCIPLE':   'DISCIPLE',
  'GUERRIER':   'GUERRIÈRE',
  'STRATÈGE':   'STRATÈGE',
  'CONQUÉRANT': 'CONQUÉRANTE',
  'CHAMPION':   'CHAMPIONNE',
  'MAÎTRE':     'MAÎTRESSE',
  'ÉLITE':      'ÉLITE',
  'AEGIS':      'AEGIS',
};

function rankDisplayName(name: string, gender: string): string {
  return gender === 'female' ? (FEMALE_RANK_NAMES[name] ?? name) : name;
}

// ─── Motif : branche de laurier (chemin SVG généré une fois) ───
function buildLaurel() {
  const P0: [number, number] = [28, 44];
  const P1: [number, number] = [4, 26];
  const P2: [number, number] = [15, 3];
  const bez = (t: number): [number, number] => {
    const u = 1 - t;
    return [
      u * u * P0[0] + 2 * u * t * P1[0] + t * t * P2[0],
      u * u * P0[1] + 2 * u * t * P1[1] + t * t * P2[1],
    ];
  };
  const tangent = (t: number): [number, number] => [
    2 * (1 - t) * (P1[0] - P0[0]) + 2 * t * (P2[0] - P1[0]),
    2 * (1 - t) * (P1[1] - P0[1]) + 2 * t * (P2[1] - P1[1]),
  ];
  const leaves: string[] = [];
  [0.22, 0.4, 0.58, 0.74, 0.89].forEach(t => {
    const b = bez(t);
    let d = tangent(t);
    const len = Math.hypot(d[0], d[1]) || 1;
    d = [d[0] / len, d[1] / len];
    const nrm = [-d[1], d[0]];
    const L = 8.5;
    const tip = [b[0] + nrm[0] * L - d[0] * 3, b[1] + nrm[1] * L - d[1] * 3];
    const mx = (b[0] + tip[0]) / 2, my = (b[1] + tip[1]) / 2, w = 3;
    const c1 = [mx + d[0] * w, my + d[1] * w];
    const c2 = [mx - d[0] * w, my - d[1] * w];
    leaves.push(
      `M${b[0].toFixed(1)},${b[1].toFixed(1)} Q${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${tip[0].toFixed(1)},${tip[1].toFixed(1)} Q${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${b[0].toFixed(1)},${b[1].toFixed(1)} Z`
    );
  });
  return { stem: `M${P0[0]},${P0[1]} Q${P1[0]},${P1[1]} ${P2[0]},${P2[1]}`, leaves };
}

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

const LAUREL = buildLaurel();
const MEANDER_CELL = 16.6;
const MEANDER_D = buildMeander(900, MEANDER_CELL, 11); // large : couvre toute barre + drift

type Particle = { id: number; angle: number; dist: number; size: number; color: string };
function makeParticles(n: number): Particle[] {
  return Array.from({ length: n }, (_, i) => {
    const angle = (Math.PI * 2 * i) / n + Math.random() * 0.3;
    return {
      id: i,
      angle,
      dist: 34 + Math.random() * 28,
      size: 2.5 + Math.random() * 3.5,
      color: Math.random() > 0.5 ? C.goldBright : C.gold,
    };
  });
}

export function XPBarAnimated({
  totalXP,
  style,
  gender = 'male',
}: {
  totalXP: number;
  style?: any;
  gender?: string;
}) {
  const [displayXP, setDisplayXP] = useState(totalXP);
  const [gain, setGain] = useState<{ amt: number; key: number } | null>(null);
  const [pillLevel, setPillLevel] = useState<number | null>(null);
  const [showBurst, setShowBurst] = useState(false);

  const xpAnim = useRef(new Animated.Value(totalXP)).current;
  const prevTotalRef = useRef(totalXP);
  const prevLevelRef = useRef(getRank(totalXP).level);

  const flashOpacity = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0.35)).current;
  const ringOpacity = useRef(new Animated.Value(0.8)).current;
  const gainOpacity = useRef(new Animated.Value(0)).current;
  const gainY = useRef(new Animated.Value(6)).current;
  const pillOpacity = useRef(new Animated.Value(0)).current;
  const pillY = useRef(new Animated.Value(8)).current;
  const sheenX = useRef(new Animated.Value(-60)).current;
  const meanderX = useRef(new Animated.Value(0)).current;

  const particles = useMemo(() => makeParticles(14), []);
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

  // écoute la valeur animée pour piloter le compteur + la barre + détecter le level-up
  useEffect(() => {
    const id = xpAnim.addListener(({ value }) => {
      setDisplayXP(value);
      const lvl = getRank(value).level;
      if (lvl > prevLevelRef.current) {
        prevLevelRef.current = lvl;
        triggerLevelUp(lvl);
      } else if (lvl < prevLevelRef.current) {
        prevLevelRef.current = lvl;
      }
    });
    return () => xpAnim.removeListener(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // réagit aux changements de totalXP (gain d'XP réel)
  useEffect(() => {
    const delta = totalXP - prevTotalRef.current;
    prevTotalRef.current = totalXP;
    if (delta === 0) return;

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
    Animated.timing(xpAnim, {
      toValue: totalXP,
      duration: dur,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // pilote un state JS (displayXP), pas une prop native
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalXP]);

  function triggerLevelUp(level: number) {
    setPillLevel(level);
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

  const rank = getRank(displayXP);
  const progress = getXPProgress(displayXP);
  const xpNeeded = getXPNeeded(displayXP);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <View style={styles.rankBlock}>
          <Svg width={20} height={30} viewBox="0 0 32 46">
            <Path d={LAUREL.stem} fill="none" stroke={rank.color} strokeWidth={1.4} opacity={0.7} />
            {LAUREL.leaves.map((d, i) => (
              <Path key={i} d={d} fill={rank.color} />
            ))}
          </Svg>
          <View style={{ alignItems: 'center' }}>
            <Text style={[styles.rankName, { color: rank.color }]}>{rankDisplayName(rank.name, gender)}</Text>
            <Text style={styles.level}>NIVEAU {rank.level}</Text>
          </View>
          <Svg width={20} height={30} viewBox="0 0 32 46" style={{ transform: [{ scaleX: -1 }] }}>
            <Path d={LAUREL.stem} fill="none" stroke={rank.color} strokeWidth={1.4} opacity={0.7} />
            {LAUREL.leaves.map((d, i) => (
              <Path key={i} d={d} fill={rank.color} />
            ))}
          </Svg>
        </View>

        <View style={styles.xpBadge}>
          <Text style={[styles.xpTotal, { color: rank.color }]}>{Math.round(displayXP).toLocaleString('fr-FR')} XP</Text>
          {rank.level < 100 && <Text style={styles.xpNeeded}>{Math.max(0, Math.ceil(xpNeeded)).toLocaleString('fr-FR')} XP restants</Text>}
        </View>
      </View>

      <View style={{ position: 'relative' }}>
        {gain && (
          <Animated.Text style={[styles.gainText, { opacity: gainOpacity, transform: [{ translateY: gainY }] }]}>
            +{gain.amt} XP
          </Animated.Text>
        )}
        {pillLevel != null && (
          <Animated.View style={[styles.pill, { opacity: pillOpacity, transform: [{ translateY: pillY }] }]}>
            <Text style={styles.pillText}>NIVEAU {pillLevel}</Text>
          </Animated.View>
        )}

        <View style={styles.barBg}>
          <View style={[styles.barFill, { backgroundColor: rank.color, width: `${Math.max(0, Math.min(1, progress)) * 100}%` }]}>
            <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX: meanderX }] }]}>
              <Svg width={900} height={11}>
                <Path d={MEANDER_D} stroke="rgba(24,17,4,0.5)" strokeWidth={1.4} fill="none" />
              </Svg>
            </Animated.View>
            <Animated.View style={[styles.sheen, { transform: [{ translateX: sheenX }] }]} />
          </View>
          {showBurst && <Animated.View style={[styles.flash, { opacity: flashOpacity }]} />}
        </View>

        {showBurst && (
          <View pointerEvents="none" style={styles.burstWrap}>
            <Animated.View style={[styles.ring, { opacity: ringOpacity, transform: [{ scale: ringScale }] }]} />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  rankBlock: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rankName: { fontFamily: 'Cinzel', fontSize: 18, letterSpacing: 2, lineHeight: 20 },
  level: { fontSize: 10, color: C.dim, marginTop: 3, letterSpacing: 1.5 },
  xpBadge: { alignItems: 'flex-end' },
  xpTotal: { fontFamily: 'SpaceMono', fontSize: 16, fontWeight: '700' },
  xpNeeded: { fontSize: 10, color: C.dim, marginTop: 2 },

  barBg: {
    height: 10,
    backgroundColor: '#1c1a16',
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.14)',
  },
  barFill: { height: '100%', borderRadius: 6, overflow: 'hidden' },
  sheen: { position: 'absolute', top: 0, bottom: 0, width: 50, backgroundColor: 'rgba(255,255,255,0.35)' },
  flash: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#fff', borderRadius: 6 },

  gainText: {
    position: 'absolute', right: 0, top: -22,
    fontFamily: 'SpaceMono', fontWeight: '700', fontSize: 13, color: C.goldBright,
  },
  pill: {
    position: 'absolute', left: '38%', top: -28,
    backgroundColor: C.goldBright, paddingHorizontal: 14, paddingVertical: 4, borderRadius: 20,
  },
  pillText: { fontFamily: 'Cinzel', fontWeight: '700', fontSize: 12, letterSpacing: 2, color: '#0d0b09' },

  burstWrap: { position: 'absolute', left: 0, right: 0, top: 5, height: 0 },
  ring: {
    position: 'absolute', left: '50%', top: 0, width: 40, height: 40, marginLeft: -20, marginTop: -20,
    borderRadius: 20, borderWidth: 1.5, borderColor: 'rgba(232,196,106,0.7)',
  },
});
