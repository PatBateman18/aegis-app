// components/WeeklyRecapModal.tsx
import { useEffect, useRef, useState } from 'react';
import {
  View, Text, Modal, StyleSheet, TouchableOpacity,
  Animated, Dimensions, Easing,
} from 'react-native';
import { C } from '@/constants/colors';
import { calcDayXP } from '@/constants/rpg';
import { calcScore, HABIT_KEYS, HABIT_LABELS, DailyLog } from '@/constants/types';

const { width, height } = Dimensions.get('window');
const PARTICLE_COUNT = 28;

// ─── Types ────────────────────────────────────────────────────────────────────

export type WeekRecapData = {
  weekLabel: string;       // ex: "5–11 MAI"
  avgScore: number;
  totalXP: number;
  workouts: number;
  perfectDays: number;
  bestHabit: string;       // label de la meilleure habitude
  bestHabitRate: number;
  verdict: string;
  verdictSub: string;
  verdictColor: string;
};

type Props = {
  visible: boolean;
  data: WeekRecapData | null;
  onClose: () => void;
};

// ─── Particule individuelle ───────────────────────────────────────────────────

function Particle({ delay, x }: { delay: number; x: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  const size = 3 + Math.random() * 5;
  const duration = 2200 + Math.random() * 1800;
  const drift = (Math.random() - 0.5) * 60;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {
          toValue: 1,
          duration,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -(height * 0.7)] });
  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [0, drift] });
  const opacity    = anim.interpolate({ inputRange: [0, 0.1, 0.8, 1], outputRange: [0, 1, 0.6, 0] });
  const scale      = anim.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 0.4] });

  return (
    <Animated.View style={{
      position: 'absolute',
      bottom: height * 0.15,
      left: x,
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: Math.random() > 0.6 ? C.goldBright : C.gold,
      opacity,
      transform: [{ translateY }, { translateX }, { scale }],
    }} />
  );
}

// ─── Stat animée ─────────────────────────────────────────────────────────────

function AnimStat({ label, value, color, delay }: {
  label: string; value: string; color: string; delay: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1, duration: 500, delay,
      easing: Easing.out(Easing.back(1.2)),
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[
      styles.statBox,
      { opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] },
    ]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
}

// ─── Modal principal ──────────────────────────────────────────────────────────

export default function WeeklyRecapModal({ visible, data, onClose }: Props) {
  const [particles] = useState(() =>
    Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: i,
      x: Math.random() * width,
      delay: Math.random() * 2000,
    }))
  );

  // Animations cinématiques
  const curtainTop    = useRef(new Animated.Value(0)).current;
  const curtainBot    = useRef(new Animated.Value(0)).current;
  const titleOpacity  = useRef(new Animated.Value(0)).current;
  const titleScale    = useRef(new Animated.Value(0.7)).current;
  const lineWidth     = useRef(new Animated.Value(0)).current;
  const contentAnim   = useRef(new Animated.Value(0)).current;
  const glowAnim      = useRef(new Animated.Value(0)).current;
  const btnAnim       = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible || !data) return;

    // Reset
    [curtainTop, curtainBot, titleOpacity, titleScale, lineWidth, contentAnim, glowAnim, btnAnim]
      .forEach(a => a.setValue(0));
    titleScale.setValue(0.7);

    // Séquence cinématique
    Animated.sequence([
      // 1. Rideaux qui s'ouvrent (300ms)
      Animated.parallel([
        Animated.timing(curtainTop, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(curtainBot, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
      Animated.delay(200),
      // 2. Titre explose
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 600, easing: Easing.out(Easing.exp), useNativeDriver: true }),
        Animated.spring(titleScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      ]),
      // 3. Ligne dorée se trace
      Animated.timing(lineWidth, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
      // 4. Contenu apparaît
      Animated.timing(contentAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      // 5. Glow pulse sur le verdict
      Animated.timing(glowAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      // 6. Bouton
      Animated.spring(btnAnim, { toValue: 1, tension: 80, friction: 10, useNativeDriver: true }),
    ]).start();
  }, [visible]);

  if (!data) return null;

  const curtainTopY = curtainTop.interpolate({ inputRange: [0, 1], outputRange: [0, -height * 0.08] });
  const curtainBotY = curtainBot.interpolate({ inputRange: [0, 1], outputRange: [0, height * 0.08] });
  const lineW       = lineWidth.interpolate({ inputRange: [0, 1], outputRange: ['0%', '80%'] });

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>

        {/* Particules dorées */}
        {particles.map(p => <Particle key={p.id} x={p.x} delay={p.delay} />)}

        {/* Rideaux cinématiques */}
        <Animated.View style={[styles.curtainTop, { transform: [{ translateY: curtainTopY }] }]} />
        <Animated.View style={[styles.curtainBot, { transform: [{ translateY: curtainBotY }] }]} />

        {/* Contenu central */}
        <View style={styles.center}>

          {/* Surtitle */}
          <Animated.Text style={[styles.surtitle, { opacity: titleOpacity }]}>
            SEMAINE ÉCOULÉE
          </Animated.Text>

          {/* Titre principal */}
          <Animated.Text style={[
            styles.title,
            { opacity: titleOpacity, transform: [{ scale: titleScale }] },
          ]}>
            {data.weekLabel}
          </Animated.Text>

          {/* Ligne dorée */}
          <View style={styles.lineContainer}>
            <Animated.View style={[styles.line, { width: lineW }]} />
          </View>

          {/* Verdict */}
          <Animated.View style={[
            styles.verdictBox,
            { borderColor: data.verdictColor + '55', backgroundColor: data.verdictColor + '10' },
            { opacity: glowAnim, transform: [{ scale: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }] },
          ]}>
            <Text style={[styles.verdictText, { color: data.verdictColor }]}>{data.verdict}</Text>
            <Text style={styles.verdictSub}>{data.verdictSub}</Text>
          </Animated.View>

          {/* Stats */}
          <Animated.View style={[styles.statsGrid, { opacity: contentAnim }]}>
            <AnimStat label="Score moyen"   value={`${data.avgScore}%`}    color={data.avgScore >= 70 ? C.gold : C.dim} delay={0} />
            <AnimStat label="XP gagnés"     value={`${data.totalXP}`}      color={C.gold}                              delay={80} />
            <AnimStat label="Séances"       value={`${data.workouts}`}     color={data.workouts >= 3 ? C.gold : C.dim} delay={160} />
            <AnimStat label="Jours parfaits" value={`${data.perfectDays}`} color={data.perfectDays > 0 ? C.goldBright : C.dim} delay={240} />
          </Animated.View>

          {/* Meilleure habitude */}
          <Animated.View style={[styles.bestHabit, { opacity: contentAnim }]}>
            <Text style={styles.bestHabitLabel}>MEILLEURE HABITUDE</Text>
            <Text style={styles.bestHabitValue}>{data.bestHabit}</Text>
            <Text style={styles.bestHabitRate}>{data.bestHabitRate}% de régularité</Text>
          </Animated.View>

          {/* Bouton */}
          <Animated.View style={{
            opacity: btnAnim,
            transform: [{ scale: btnAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }],
          }}>
            <TouchableOpacity style={styles.btn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.btnText}>CONTINUER ⚔️</Text>
            </TouchableOpacity>
          </Animated.View>

        </View>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(4,3,1,0.97)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  curtainTop: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: height * 0.08,
    backgroundColor: '#0a0800',
    borderBottomWidth: 1,
    borderBottomColor: C.goldDim,
  },
  curtainBot: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: height * 0.08,
    backgroundColor: '#0a0800',
    borderTopWidth: 1,
    borderTopColor: C.goldDim,
  },
  center: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  surtitle: {
    fontSize: 10,
    letterSpacing: 6,
    color: C.dim,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  title: {
    fontFamily: 'Cinzel',
    fontSize: 32,
    color: C.goldBright,
    letterSpacing: 4,
    textAlign: 'center',
    marginBottom: 16,
  },
  lineContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  line: {
    height: 1,
    backgroundColor: C.gold,
    opacity: 0.6,
  },
  verdictBox: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  verdictText: {
    fontFamily: 'Cinzel',
    fontSize: 16,
    letterSpacing: 2,
    marginBottom: 6,
  },
  verdictSub: {
    fontSize: 12,
    color: C.dim,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    width: '100%',
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: C.s1,
    borderWidth: 1,
    borderColor: C.s3,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: 'SpaceMono',
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 28,
  },
  statLabel: {
    fontSize: 9,
    color: C.dim,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
  },
  bestHabit: {
    alignItems: 'center',
    marginBottom: 28,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: C.s3,
    width: '100%',
  },
  bestHabitLabel: {
    fontSize: 9,
    color: C.dim,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  bestHabitValue: {
    fontFamily: 'Cinzel',
    fontSize: 18,
    color: C.gold,
    letterSpacing: 1,
    marginBottom: 4,
  },
  bestHabitRate: {
    fontSize: 12,
    color: C.dim,
  },
  btn: {
    backgroundColor: C.gold,
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 14,
  },
  btnText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 3,
  },
});
