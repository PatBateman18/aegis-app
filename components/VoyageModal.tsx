// components/VoyageModal.tsx
import { useEffect, useRef, useState } from 'react';
import {
  View, Text, Image, Modal, ScrollView,
  TouchableOpacity, StyleSheet, Dimensions,
  Animated, Easing,
} from 'react-native';
import Svg, { Path, Defs, LinearGradient as SvgGrad, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MedalBadge from '@/components/MedalBadge';
import { C } from '@/constants/colors';
import { type StreakMilestone } from '@/constants/rpg';

const { width } = Dimensions.get('window');
const GOLD   = '#C9A84C';
const GOLDB  = '#E8C46A';
const XP_PER_BADGE = 60;

const ZONE_H  = 460;
const BADGE_S = 100;
const TOTAL_H = (n: number) => n * ZONE_H;

const MEDAL_BG = [
  require('@/assets/medals/bg_bronze.png'),
  require('@/assets/medals/bg_silver.png'),
  require('@/assets/medals/bg_gold.png'),
  require('@/assets/medals/bg_platinum.png'),
  require('@/assets/medals/bg_conqueror.png'),
  require('@/assets/medals/bg_diamond.png'),
  require('@/assets/medals/bg_centurion.png'),
  require('@/assets/medals/bg_legend.png'),
];

const MEDAL_BG_FEMALE = [
  require('@/assets/medals/bg_bronze_femme.png'),
  require('@/assets/medals/bg_silver_femme.png'),
  require('@/assets/medals/bg_gold_femme.png'),
  require('@/assets/medals/bg_platinum_femme.png'),
  require('@/assets/medals/bg_conqueror_femme.png'),
  require('@/assets/medals/bg_diamond_femme.png'),
  require('@/assets/medals/bg_centurion.png'),   // pas de version femme
  require('@/assets/medals/bg_legend.png'),       // pas de version femme
];

function bx(i: number) { return i % 2 === 0 ? width * 0.65 : width * 0.30; }
function by(i: number) { return i * ZONE_H + ZONE_H * 0.48; }

// ─── Badge — aucun halo, aucun cercle ────────────────────────────────────────
function CleanBadge({ m, i, achieved, streak, gender = 'male' }: {
  m: StreakMilestone; i: number; achieved: boolean; streak: number; gender?: string;
}) {
  const scale = useRef(new Animated.Value(achieved ? 1 : 0.88)).current;
  const prev  = useRef(achieved);

  useEffect(() => {
    if (achieved && !prev.current) {
      Animated.sequence([
        Animated.spring(scale, { toValue: 1.2, tension: 220, friction: 6,  useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1,   tension: 180, friction: 10, useNativeDriver: true }),
      ]).start();
    }
    prev.current = achieved;
  }, [achieved]);

  return (
    <Animated.View style={{ transform: [{ scale }], alignItems: 'center' }}>
      <MedalBadge milestoneIndex={i} achieved={achieved} size={BADGE_S} gender={gender} />
      {!achieved && (
        <View style={s.lockBadge}>
          <Text style={{ fontSize: 10 }}>🔒</Text>
        </View>
      )}
    </Animated.View>
  );
}

// ─── Panneau info (ouvert via bouton i) ──────────────────────────────────────

// ─── MedalImage — chargement avec placeholder + fondu ────────────────────────
function MedalImage({ source, achieved }: { source: any; achieved: boolean }) {
  const opacity = useRef(new Animated.Value(0)).current;

  function onLoad() {
    Animated.timing(opacity, {
      toValue: 1, duration: 400, useNativeDriver: true,
    }).start();
  }

  return (
    <View style={{ width: '100%', height: '100%' }}>
      {/* Placeholder doré pendant le chargement */}
      <View style={{
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#0A0800',
      }} />
      <Animated.Image
        source={source}
        style={{ width: '100%', height: '100%', opacity: Animated.multiply(opacity, achieved ? 0.88 : 0.12) }}
        blurRadius={achieved ? 0 : 12}
        resizeMode="cover"
        onLoad={onLoad}
      />
    </View>
  );
}

function InfoPanel({ milestones, streak, bestStreak, unlockedSet, onClose, gender = 'male' }: {
  milestones: StreakMilestone[];
  streak: number;
  bestStreak: number;
  unlockedSet: Set<number>;
  onClose: () => void;
  gender?: string;
}) {
  return (
    <Modal visible animationType="slide" transparent>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: '#0A0800', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, borderColor: GOLD + '44', maxHeight: '80%' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' }}>
            <Text style={{ fontFamily: 'Cinzel', fontSize: 14, color: GOLDB, letterSpacing: 3 }}>MÉDAILLES</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={{ color: C.dim, fontSize: 18 }}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            {milestones.map((m, i) => {
              const achieved = streak >= m.days || bestStreak >= m.days || unlockedSet.has(m.days);
              return (
                <View key={m.days} style={{
                  flexDirection: 'row', alignItems: 'center', gap: 14,
                  backgroundColor: achieved ? m.color + '0C' : C.s1,
                  borderWidth: 1, borderColor: achieved ? m.color + '44' : C.s3,
                  borderRadius: 14, padding: 14, marginBottom: 10,
                }}>
                  <MedalBadge milestoneIndex={i} achieved={achieved} size={56} gender={gender} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: 'Cinzel', fontSize: 12, color: achieved ? m.color : C.dim, letterSpacing: 1, marginBottom: 3 }}>
                      {m.title.toUpperCase()}
                    </Text>
                    <Text style={{ fontSize: 11, color: C.dim, lineHeight: 16 }}>{m.description}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                      <Text style={{ fontSize: 9, color: '#555', letterSpacing: 1 }}>{m.days} JOURS</Text>
                      <Text style={{ fontSize: 9, color: '#333' }}>·</Text>
                      <Text style={{ fontSize: 9, color: achieved ? GOLD : '#555', letterSpacing: 1 }}>
                        +{XP_PER_BADGE} XP
                      </Text>
                      {achieved && (
                        <View style={{ backgroundColor: m.color + '22', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 4 }}>
                          <Text style={{ fontSize: 8, color: m.color, fontWeight: '700' }}>OBTENU ✓</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  {!achieved && (
                    <View style={{ alignItems: 'center' }}>
                      <Text style={{ fontFamily: 'SpaceMono', fontSize: 18, color: '#2a2a2a' }}>{m.days - streak}</Text>
                      <Text style={{ fontSize: 8, color: '#333' }}>jours</Text>
                    </View>
                  )}
                </View>
              );
            })}
            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
interface Props {
  visible: boolean;
  onClose: () => void;
  milestones: StreakMilestone[];
  streak: number;
  bestStreak: number;
  unlockedSet: Set<number>;
  gender?: string;
}

export default function VoyageModal({ visible, onClose, milestones, streak, bestStreak, unlockedSet, gender = 'male' }: Props) {
  const insets    = useSafeAreaInsets();
  const [showInfo, setShowInfo] = useState(false);
  const medalBg   = gender === 'female' ? MEDAL_BG_FEMALE : MEDAL_BG;
  const n         = milestones.length;
  const totalH    = TOTAL_H(n);
  const totalDays = milestones[n - 1]?.days ?? 1;
  const progress  = Math.min(streak / totalDays, 1);
  const doneCount = milestones.filter(m =>
    streak >= m.days || bestStreak >= m.days || unlockedSet.has(m.days)
  ).length;
  const totalXPEarned = doneCount * XP_PER_BADGE;

  const pts = milestones.map((_, i) => ({ x: bx(i), y: by(i) }));

  let pathD = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1], c = pts[i];
    const midY = (p.y + c.y) / 2;
    pathD += ` C ${p.x},${midY} ${c.x},${midY} ${c.x},${c.y}`;
  }

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent presentationStyle="fullScreen">
      <View style={{ flex: 1, backgroundColor: '#04030A' }}>

        {/* Header */}
        <View style={[s.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={onClose} style={s.headerBtn}>
            <Text style={{ color: GOLDB, fontSize: 22, lineHeight: 22, marginTop: 1 }}>‹</Text>
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 24, height: 1, backgroundColor: GOLD + '66' }} />
              <Text style={s.headerTitle}>LE VOYAGE AEGIS</Text>
              <View style={{ width: 24, height: 1, backgroundColor: GOLD + '66' }} />
            </View>
            <Text style={s.headerSub}>Chaque pas te rapproche de ta légende.</Text>
          </View>
          {/* Bouton i */}
          <TouchableOpacity onPress={() => setShowInfo(true)} style={s.headerBtn}>
            <Text style={{ color: GOLD, fontSize: 13, fontFamily: 'Cinzel', fontWeight: '700' }}>i</Text>
          </TouchableOpacity>
        </View>

        {/* Scroll contenu */}
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={{ width, height: totalH }}>

            {/* Fonds image — pleine largeur empilés */}
            {milestones.map((_, i) => {
              const achieved = streak >= milestones[i].days || bestStreak >= milestones[i].days || unlockedSet.has(milestones[i].days);
              return (
                <View key={i} style={{
                  position: 'absolute',
                  top: i * ZONE_H, left: 0, right: 0, height: ZONE_H,
                  overflow: 'hidden',
                }}>
                  <MedalImage
                    source={medalBg[Math.min(i, medalBg.length - 1)]}
                    achieved={achieved}
                  />
                  {/* Fondu bas — découpe nette */}
                  <LinearGradient
                    colors={['transparent', 'rgba(4,3,10,0.95)']}
                    locations={[0.5, 1]}
                    style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80 }}
                  />
                  {/* Fondu haut — découpe nette */}
                  {i > 0 && (
                    <LinearGradient
                      colors={['rgba(4,3,10,0.95)', 'transparent']}
                      locations={[0, 0.5]}
                      style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 60 }}
                    />
                  )}
                  {!achieved && (
                    <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.5)' }]} />
                  )}
                </View>
              );
            })}

            {/* SVG chemin doré avec glow */}
            <Svg width={width} height={totalH} style={StyleSheet.absoluteFillObject} pointerEvents="none">
              <Defs>
                <SvgGrad id="gGold" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0"   stopColor={GOLDB} stopOpacity="1"   />
                  <Stop offset="0.6" stopColor={GOLD}  stopOpacity="0.9" />
                  <Stop offset="1"   stopColor={GOLD}  stopOpacity="0.2" />
                </SvgGrad>
              </Defs>
              {/* Glow large derrière */}
              <Path d={pathD} fill="none" stroke={GOLDB} strokeWidth={14} strokeOpacity={0.12} strokeLinecap="round" />
              <Path d={pathD} fill="none" stroke={GOLD}  strokeWidth={8}  strokeOpacity={0.22} strokeLinecap="round" />
              {/* Fond pointillé gris */}
              <Path d={pathD} fill="none" stroke="#2a2520" strokeWidth={3} strokeDasharray="10 8" />
              {/* Ligne dorée principale */}
              <Path d={pathD} fill="none" stroke="url(#gGold)" strokeWidth={3.5} strokeLinecap="round" />
            </Svg>

            {/* Badges — juste les médailles, sans texte ni halo */}
            {milestones.map((m, i) => {
              const achieved = streak >= m.days || bestStreak >= m.days || unlockedSet.has(m.days);
              const px = pts[i].x;
              const py = pts[i].y;

              return (
                <View key={m.days} style={{
                  position: 'absolute',
                  left: px - BADGE_S / 2 - 4,
                  top:  py - BADGE_S / 2 - 4,
                  width: BADGE_S + 8,
                  height: BADGE_S + 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <CleanBadge m={m} i={i} achieved={achieved} streak={streak} gender={gender} />
                </View>
              );
            })}

          </View>
        </ScrollView>

        {/* Footer */}
        <View style={[s.footer, { paddingBottom: insets.bottom + 8 }]}>
          <View style={{ alignItems: 'flex-start' }}>
            <Text style={s.footerLabel}>PROGRESSION{'\n'}GLOBALE</Text>
            <Text style={s.footerValue}>{Math.round(progress * 100)}%</Text>
            <View style={{ height: 2, backgroundColor: '#1a1a1a', borderRadius: 1, overflow: 'hidden', marginTop: 5, width: 64 }}>
              <View style={{ height: 2, backgroundColor: GOLD, borderRadius: 1, width: `${Math.round(progress * 100)}%` as any }} />
            </View>
          </View>

          <View style={{ width: 1, backgroundColor: '#1a1a1a', alignSelf: 'stretch', marginHorizontal: 14 }} />

          <View style={{ alignItems: 'flex-start' }}>
            <Text style={s.footerLabel}>MÉDAILLES{'\n'}OBTENUES</Text>
            <Text style={s.footerValue}>{doneCount} / {n}</Text>
          </View>

          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <TouchableOpacity style={s.rewardBtn}>
              <Text style={{ fontSize: 18 }}>🎁</Text>
              <View>
                <Text style={s.rewardTitle}>RÉCOMPENSES</Text>
                <Text style={s.rewardXP}>+{totalXPEarned} XP</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

      </View>

      {showInfo && (
        <InfoPanel
          milestones={milestones}
          streak={streak}
          bestStreak={bestStreak}
          unlockedSet={unlockedSet}
          gender={gender}
          onClose={() => setShowInfo(false)}
        />
      )}

    </Modal>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: 14, paddingBottom: 10,
    backgroundColor: 'rgba(4,3,10,0.97)',
    zIndex: 10,
  },
  headerBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: GOLD + '18',
    borderWidth: 1, borderColor: GOLD + '44',
    alignItems: 'center', justifyContent: 'center',
    marginTop: 2,
  },
  headerTitle: {
    fontFamily: 'Cinzel', fontSize: 13,
    color: GOLDB, letterSpacing: 4, marginBottom: 4,
  },
  headerSub: {
    fontSize: 11, color: '#555', fontStyle: 'italic',
  },
  lockBadge: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
    borderRadius: 10, paddingHorizontal: 5, paddingVertical: 2,
    borderWidth: 1, borderColor: '#2a2a2a',
  },
  footer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(4,3,10,0.98)',
    borderTopWidth: 1, borderTopColor: GOLD + '22',
    paddingHorizontal: 16, paddingTop: 14,
  },
  footerLabel: {
    fontSize: 8, color: '#555', letterSpacing: 1.5,
    textTransform: 'uppercase', lineHeight: 12, marginBottom: 4,
  },
  footerValue: {
    fontFamily: 'SpaceMono', fontSize: 20, color: GOLDB, lineHeight: 24,
  },
  rewardBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: GOLD + '1A', borderWidth: 1,
    borderColor: GOLD + '55', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  rewardTitle: {
    fontSize: 10, color: GOLDB, fontWeight: '700',
    letterSpacing: 1, lineHeight: 14,
  },
  rewardXP: {
    fontFamily: 'SpaceMono', fontSize: 14,
    color: GOLD, lineHeight: 18,
  },
});
