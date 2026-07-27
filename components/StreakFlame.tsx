// components/StreakFlame.tsx
// Série de jours (streak) : une flamme sacrée qui grandit avec le palier atteint,
// le nombre de jours en transition fluide (roulement), et les boucliers hoplites
// de la semaine. S'appuie sur STREAK_MILESTONES / getCurrentMilestone / getNextMilestone
// de constants/rpg.ts — aucune donnée de palier dupliquée ici.
//
// Dépendances déjà présentes dans le projet : react-native-svg, expo-font (Cinzel).
// Usage :
//   <StreakFlame days={profile.streak} weekCompleted={last7Days} />
// `weekCompleted` (optionnel) : tableau de 7 booléens Lundi→Dimanche pour les vrais
// jours validés. Si omis, approxime avec les `days` restants dans la semaine en cours
// (comme la maquette) — à remplacer par tes vraies données dès que possible.

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Path } from 'react-native-svg';
import { C } from '@/constants/colors';
import { STREAK_MILESTONES, getCurrentMilestone, getNextMilestone } from '@/constants/rpg';

const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

function tierIndexFor(days: number): number {
  // 0: aucun palier, 1: bronze (3-14j), 2: or (21-30j), 3: or clair (60-100j), 4: blanc (365j)
  const achievedCount = STREAK_MILESTONES.filter(m => days >= m.days).length;
  return Math.min(4, achievedCount);
}

const TIER_FLAME_SCALE = [1, 1.06, 1.14, 1.22, 1.32];
const TIER_HALO = [
  'rgba(201,102,42,0.30)',
  'rgba(220,120,40,0.36)',
  'rgba(232,162,42,0.42)',
  'rgba(240,190,100,0.48)',
  'rgba(255,250,235,0.56)',
];

export function StreakFlame({
  days,
  weekCompleted,
  style,
  compact = false,
  size = 110,
  showHalo = true,
  horizontal = false,
}: {
  days: number;
  weekCompleted?: boolean[];
  style?: any;
  compact?: boolean;
  size?: number;
  showHalo?: boolean;
  horizontal?: boolean;
}) {
  const [displayDays, setDisplayDays] = useState(days);
  const [prevDays, setPrevDays] = useState(days);
  const [rolling, setRolling] = useState(false);
  const [showSparks, setShowSparks] = useState(false);
  const [kickIndex, setKickIndex] = useState(-1);

  const outY = useRef(new Animated.Value(0)).current;
  const outOpacity = useRef(new Animated.Value(1)).current;
  const inY = useRef(new Animated.Value(40)).current;
  const inOpacity = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0)).current;
  const flameScaleAnim = useRef(new Animated.Value(TIER_FLAME_SCALE[tierIndexFor(days)])).current;

  const flick1 = useRef(new Animated.Value(0)).current;
  const flick2 = useRef(new Animated.Value(0)).current;
  const core = useRef(new Animated.Value(0)).current;
  const haze = useRef(new Animated.Value(0)).current;

  const sparkAnims = useRef(
    Array.from({ length: 12 }, () => new Animated.Value(0))
  ).current;
  const sparkGeo = useRef(
    Array.from({ length: 12 }, (_, i) => {
      const a = (Math.PI * 2 * i) / 12 + Math.random() * 0.3;
      const d = 46 + Math.random() * 32;
      return { angle: a, dist: d, size: 2.5 + Math.random() * 2.5, white: Math.random() > 0.5 };
    })
  ).current;

  const prevTierRef = useRef(tierIndexFor(days));
  const firstRunRef = useRef(true);

  // boucles perpétuelles : vacillement de la flamme + halo
  useEffect(() => {
    const loop = (val: Animated.Value, dur: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(val, { toValue: 1, duration: dur, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(val, { toValue: 0, duration: dur, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ])
      );
    loop(flick1, 575).start();
    loop(flick2, 450).start();
    loop(core, 400).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(haze, { toValue: 1, duration: 1700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(haze, { toValue: 0, duration: 1700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (firstRunRef.current) {
      firstRunRef.current = false;
      return; // pas d'animation de transition au premier rendu
    }
    const newTier = tierIndexFor(days);
    const hitMilestone = newTier > prevTierRef.current;
    prevTierRef.current = newTier;

    setPrevDays(displayDays);
    setDisplayDays(days);
    setKickIndex(((days - 1) % 7));
    setRolling(true);

    outY.setValue(0); outOpacity.setValue(1);
    inY.setValue(40); inOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(outY, { toValue: -40, duration: 460, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(outOpacity, { toValue: 0, duration: 460, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(inY, { toValue: 0, duration: 460, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(inOpacity, { toValue: 1, duration: 460, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(flameScaleAnim, { toValue: TIER_FLAME_SCALE[newTier], duration: 600, useNativeDriver: true }),
    ]).start(() => setRolling(false));

    if (hitMilestone) {
      setShowSparks(true);
      sparkAnims.forEach(a => a.setValue(0));
      Animated.parallel(
        sparkAnims.map(a => Animated.timing(a, { toValue: 1, duration: 800, easing: Easing.out(Easing.quad), useNativeDriver: true }))
      ).start(() => setShowSparks(false));

      glowPulse.setValue(0);
      Animated.timing(glowPulse, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.quad), useNativeDriver: false }).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  const tier = tierIndexFor(displayDays);
  const flameScale = flameScaleAnim;
  const haloColor = TIER_HALO[tier];
  const next = getNextMilestone(displayDays);
  const current = getCurrentMilestone(displayDays);

  const flickRotate1 = flick1.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '2deg'] });
  const flickScaleY1 = flick1.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] });
  const flickScaleY2 = flick2.interpolate({ inputRange: [0, 1], outputRange: [1, 1.07] });
  const coreScaleY = core.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });
  const hazeOpacity = haze.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0.85] });

  const filledInWeek = weekCompleted ?? DAY_LABELS.map((_, i) => i < ((displayDays - 1) % 7) + 1);
  const glowShadow = glowPulse.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  const flameW = size;
  const flameH = Math.round(size * (104 / 110));
  const haloSize = Math.round(size * 1.8);

  // ─── Mode horizontal (façon mockup profil) ───
  if (horizontal) {
    return (
      <View style={style}>
        <Text style={[styles.title, { textAlign: 'left', letterSpacing: 2 }]}>SÉRIE EN COURS</Text>

        {/* Ligne : nombre + jours | flamme */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
            <Text style={[styles.number, { fontSize: 34, lineHeight: 38 }]}>{displayDays}</Text>
            <Text style={{ fontFamily: 'Cinzel', fontSize: 11, letterSpacing: 2, color: '#8a7a4a' }}>jours</Text>
          </View>
          <Animated.View style={{ transform: [{ scale: flameScale }, { rotate: flickRotate1 }, { scaleY: flickScaleY2 }] }}>
            <Svg width={flameW} height={flameH} viewBox="0 0 200 190">
              <Defs>
                <LinearGradient id="fl-out-h" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor="#F4A83C" />
                  <Stop offset="0.45" stopColor="#DC7326" />
                  <Stop offset="1" stopColor="#8E3F14" />
                </LinearGradient>
                <LinearGradient id="fl-mid-h" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor="#FFD880" />
                  <Stop offset="1" stopColor="#EF8E2C" />
                </LinearGradient>
                <LinearGradient id="fl-core-h" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor="#FFFFFF" />
                  <Stop offset="1" stopColor="#FFE7AC" />
                </LinearGradient>
              </Defs>
              <Path d="M100,14 C126,68 156,90 146,138 C139,170 121,182 100,182 C79,182 61,170 54,138 C44,90 74,68 100,14 Z" fill="url(#fl-out-h)" opacity={0.96} />
              <Path d="M100,50 C119,96 138,110 131,144 C127,168 113,176 100,176 C87,176 73,168 69,144 C62,110 81,96 100,50 Z" fill="url(#fl-mid-h)" />
              <Path d="M100,92 C111,120 122,130 118,152 C115,168 107,173 100,173 C93,173 85,168 82,152 C78,130 89,120 100,92 Z" fill="url(#fl-core-h)" />
            </Svg>
          </Animated.View>
        </View>

        {/* Semaine */}
        <View style={[styles.week, { marginTop: 12, gap: 4 }]}>
          {DAY_LABELS.map((label, i) => {
            const filled = filledInWeek[i];
            return (
              <View key={i} style={[styles.dayCol, { gap: 4 }]}>
                <Text style={styles.dayLabel}>{label}</Text>
                <View style={[styles.shield, { width: 22, height: 22, borderRadius: 11 }, filled ? styles.shieldFilled : styles.shieldEmpty]}>
                  <Svg width={10} height={10} viewBox="0 0 20 20">
                    <Path d="M3.5,16.5 L10,3.5 L16.5,16.5" fill="none" stroke={filled ? '#F4DB92' : '#3a352c'} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                </View>
              </View>
            );
          })}
        </View>

        {/* Palier */}
        <Text style={[styles.milestoneLine, { marginTop: 12, fontSize: 8.5 }]}>
          PROCHAIN PALIER · <Text style={styles.milestoneAccent}>{next ? `${next.days} J` : '—'}</Text>
          {next ? <> · ENCORE <Text style={styles.milestoneAccent}>{next.days - displayDays} J</Text></> : null}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {!compact && <Text style={styles.title}>SÉRIE EN COURS</Text>}

      <View style={[styles.flameStage, compact && { height: flameH + 12, marginTop: 0 }]}>
        {!compact && showHalo && (
          <Animated.View
            style={[
              styles.halo,
              { width: haloSize, height: haloSize, borderRadius: haloSize / 2, backgroundColor: 'transparent', opacity: hazeOpacity },
            ]}
          >
            <View style={[styles.haloInner, { width: haloSize, height: haloSize, borderRadius: haloSize / 2, backgroundColor: haloColor }]} />
          </Animated.View>
        )}

        <Animated.View style={{ transform: [{ scale: flameScale }, { rotate: flickRotate1 }, { scaleY: flickScaleY2 }] }}>
          <Svg width={flameW} height={flameH} viewBox="0 0 200 190">
            <Defs>
              <LinearGradient id="fl-out" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#F4A83C" />
                <Stop offset="0.45" stopColor="#DC7326" />
                <Stop offset="1" stopColor="#8E3F14" />
              </LinearGradient>
              <LinearGradient id="fl-mid" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#FFD880" />
                <Stop offset="1" stopColor="#EF8E2C" />
              </LinearGradient>
              <LinearGradient id="fl-core" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#FFFFFF" />
                <Stop offset="1" stopColor="#FFE7AC" />
              </LinearGradient>
            </Defs>
            <Animated.View />
            <Path
              d="M100,14 C126,68 156,90 146,138 C139,170 121,182 100,182 C79,182 61,170 54,138 C44,90 74,68 100,14 Z"
              fill="url(#fl-out)"
              opacity={0.96}
            />
            <Path
              d="M100,50 C119,96 138,110 131,144 C127,168 113,176 100,176 C87,176 73,168 69,144 C62,110 81,96 100,50 Z"
              fill="url(#fl-mid)"
            />
            <Path
              d="M100,92 C111,120 122,130 118,152 C115,168 107,173 100,173 C93,173 85,168 82,152 C78,130 89,120 100,92 Z"
              fill="url(#fl-core)"
            />
          </Svg>
        </Animated.View>

        {showSparks && !compact && (
          <View pointerEvents="none" style={styles.sparkWrap}>
            {sparkGeo.map((g, i) => {
              const t = sparkAnims[i];
              const tx = t.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(g.angle) * g.dist] });
              const ty = t.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(g.angle) * g.dist] });
              const op = t.interpolate({ inputRange: [0, 0.16, 1], outputRange: [0, 1, 0] });
              return (
                <Animated.View
                  key={i}
                  style={{
                    position: 'absolute',
                    width: g.size,
                    height: g.size,
                    borderRadius: g.size / 2,
                    backgroundColor: g.white ? '#fff' : '#F4DB92',
                    opacity: op,
                    transform: [{ translateX: tx }, { translateY: ty }],
                  }}
                />
              );
            })}
          </View>
        )}
      </View>

      <View style={[styles.numberStage, compact && { height: 30, marginTop: 2 }]}>
        {rolling ? (
          <>
            <Animated.Text
              style={[styles.number, compact && styles.numberCompact, { position: 'absolute', opacity: outOpacity, transform: [{ translateY: outY }] }]}
            >
              {prevDays}
            </Animated.Text>
            <Animated.Text
              style={[styles.number, styles.numberGlow, compact && styles.numberCompact, { position: 'absolute', opacity: inOpacity, transform: [{ translateY: inY }] }]}
            >
              {displayDays}
            </Animated.Text>
          </>
        ) : (
          <Text style={[styles.number, compact && styles.numberCompact]}>{displayDays}</Text>
        )}
      </View>
      {!compact && <Text style={styles.subLabel}>JOURS DE SÉRIE</Text>}

      {!compact && (
        <View style={styles.week}>
          {DAY_LABELS.map((label, i) => {
            const filled = filledInWeek[i];
            const kick = i === kickIndex;
            return (
              <View key={i} style={styles.dayCol}>
                <Text style={styles.dayLabel}>{label}</Text>
                <View
                  style={[
                    styles.shield,
                    filled ? styles.shieldFilled : styles.shieldEmpty,
                  ]}
                >
                  <Svg width={13} height={13} viewBox="0 0 20 20">
                    <Path
                      d="M3.5,16.5 L10,3.5 L16.5,16.5"
                      fill="none"
                      stroke={filled ? '#F4DB92' : '#3a352c'}
                      strokeWidth={2.2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {!compact && (
        <Text style={styles.milestoneLine}>
          PROCHAIN PALIER · <Text style={styles.milestoneAccent}>{next ? `${next.days} JOURS` : '—'}</Text>
          {next ? <> · ENCORE <Text style={styles.milestoneAccent}>{next.days - displayDays} J</Text></> : null}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', width: '100%' },
  title: { fontFamily: 'Cinzel', fontSize: 10, letterSpacing: 5, color: C.gold, fontWeight: '600' },
  flameStage: { height: 150, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  halo: { position: 'absolute', width: 200, height: 200, borderRadius: 100, alignItems: 'center', justifyContent: 'center' },
  haloInner: { position: 'absolute', width: 200, height: 200, borderRadius: 100 },
  sparkWrap: { position: 'absolute', width: 1, height: 1, alignItems: 'center', justifyContent: 'center' },
  numberStage: { height: 60, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  number: { fontFamily: 'Cinzel', fontWeight: '800', fontSize: 56, lineHeight: 58, color: '#F0D488' },
  numberCompact: { fontFamily: 'SpaceMono', fontSize: 20, lineHeight: 22 },
  numberGlow: { textShadowColor: 'rgba(232,196,106,0.5)', textShadowRadius: 16, textShadowOffset: { width: 0, height: 0 } },
  subLabel: { fontFamily: 'Cinzel', fontSize: 10, letterSpacing: 4, color: '#8a7a4a', marginTop: 6 },
  week: { flexDirection: 'row', justifyContent: 'space-between', gap: 7, marginTop: 24, width: '100%' },
  dayCol: { flex: 1, alignItems: 'center', gap: 6 },
  dayLabel: { fontSize: 8, letterSpacing: 0.5, color: '#4a463f' },
  shield: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  shieldFilled: { borderColor: C.gold, backgroundColor: '#6b4a22' },
  shieldEmpty: { borderColor: '#241f18', backgroundColor: '#0e0c09' },
  milestoneLine: { fontFamily: 'Cinzel', fontSize: 9.5, letterSpacing: 1.5, color: '#6a655b', marginTop: 22, textAlign: 'center' },
  milestoneAccent: { color: C.gold },
});
