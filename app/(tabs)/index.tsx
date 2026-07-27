import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Image, Dimensions, Animated,
  Easing, TextInput, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import EveningSummary from '@/components/EveningSummary';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useDay } from '@/hooks/useDay';
import { useStreakShields } from '@/hooks/useStreakShields';
import { usePause } from '@/hooks/usePause';
import { useAmbientSound } from '@/hooks/useAmbientSound';
import { useInactivity } from '@/hooks/useInactivity';
import { C } from '@/constants/colors';
import { HABIT_KEYS, HABIT_LABELS, calcScore } from '@/constants/types';
import {
  calcTotalXP, calcDayXP, getRank, getXPProgress, RANKS,
  getCurrentMilestone, getNextMilestone, STREAK_MILESTONES,
} from '@/constants/rpg';
import { supabase } from '@/lib/supabase';
import WeeklyRecapModal from '@/components/WeeklyRecapModal';
import { useWeeklyRecap } from '@/hooks/useWeeklyRecap';
import PerfectDayCelebration from '@/components/PerfectDayCelebration';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import MedalBadge from '@/components/MedalBadge';
import { XPFillBar } from '@/components/XPFillBar';
import { StreakFlame } from '@/components/StreakFlame';

// ─── Médailles de rang (niveau 1 à 10) ─────────────────────────────────────
const RANK_MEDALS: Record<number, any> = {
  1:  require('@/assets/medals/medaille_rang_01_novice.png'),
  2:  require('@/assets/medals/medaille_rang_02_initie.png'),
  3:  require('@/assets/medals/medaille_rang_03_disciple.png'),
  4:  require('@/assets/medals/medaille_rang_04_guerrier.png'),
  5:  require('@/assets/medals/medaille_rang_05_strategie.png'),
  6:  require('@/assets/medals/medaille_rang_06_conquerant.png'),
  7:  require('@/assets/medals/medaille_rang_07_champion.png'),
  8:  require('@/assets/medals/medaille_rang_08_maitre.png'),
  9:  require('@/assets/medals/medaille_rang_09_elite.png'),
  10: require('@/assets/medals/medaille_rang_10_aegis.png'),
};
import LevelUpModal from '@/components/LevelUpModal';
import { getTodayQuests, adaptQuestsForGender, type Quest } from '@/constants/quests';
import { useSound } from '@/hooks/useSound';
import { useGender } from '@/hooks/useGender';
import { ActionRow } from '@/components/ui';
import QuestBanner from '@/components/QuestBanner';
import QuestsScreen from '@/components/QuestsScreen';
import NotificationSettings from '@/components/NotifSettings';

const { width, height } = Dimensions.get('window');
const GOLD  = '#C9A84C';
const GOLDB = '#E8C46A';

// ─── Assets ───────────────────────────────────────────────────────────────────
const HERO_IMG    = require('@/assets/hero/hero_accueil.png');
const BG_MISSION  = require('@/assets/hero/bg_mission.png');
const BG_QUOTE    = require('@/assets/hero/bg_quote_accueil.png');

const STAT_ICONS: Record<string, any> = {
  calories:    require('@/assets/ui/icone_calories2.png'),
  entrainement:require('@/assets/ui/icone_seance2.png'),
  lecture:     require('@/assets/ui/icone_lecture2.png'),
  eau:         require('@/assets/ui/icone_eau2.png'),
};

const HABIT_IMAGES: Record<string, any> = {
  workout_done:  require('@/assets/ui/icone_seance.png'),
  calories_ok:   require('@/assets/ui/icone_calories.png'),
  learning_done: require('@/assets/ui/icone_lecture.png'),
  m_face:        require('@/assets/ui/icone_skincare.png'),
  outfit_ok:     require('@/assets/ui/icone_style.png'),
  morning_water: require('@/assets/ui/icone_eau.png'),
};

import { Modal } from 'react-native';
function MilestoneModal({ milestone, onClose }: { milestone: any; onClose: () => void }) {
  const idx = STREAK_MILESTONES.findIndex((m: any) => m.days === milestone.days);
  return (
    <Modal visible transparent animationType="fade">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center', padding: 32 }}>
        <View style={{ backgroundColor: '#0A0800', borderRadius: 24, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: milestone.color + '44', width: '100%' }}>
          <MedalBadge milestoneIndex={idx >= 0 ? idx : 0} achieved size={100} />
          <Text style={{ fontFamily: 'Cinzel', fontSize: 22, letterSpacing: 3, color: milestone.color, marginBottom: 8, marginTop: 8 }}>{milestone.title}</Text>
          <Text style={{ fontSize: 13, color: C.dim, textAlign: 'center', lineHeight: 20, marginBottom: 24 }}>{milestone.description}</Text>
          <TouchableOpacity style={{ backgroundColor: milestone.color, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14 }} onPress={onClose}>
            <Text style={{ color: '#000', fontWeight: '700', fontSize: 14, letterSpacing: 2 }}>CONTINUER</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── StatTile ─────────────────────────────────────────────────────────────────
function StatTile({ icon, value, target, unit, label, color = GOLD, onChange, keyboardType = 'numeric' }: {
  icon: any; value: number; target: number; unit: string; label: string;
  color?: string; onChange: (v: number | undefined) => void; keyboardType?: any;
}) {
  const pct      = target > 0 ? Math.min(value / target, 1) : 0;
  const reached  = value >= target && target > 0;
  const barAnim  = useRef(new Animated.Value(0)).current;
  const prevPct  = useRef(0);
  const [text, setText] = useState(value > 0 ? String(value) : '');

  useEffect(() => {
    if (pct !== prevPct.current) {
      Animated.timing(barAnim, {
        toValue: pct,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
      prevPct.current = pct;
    }
  }, [pct]);

  // Sync text si value change depuis l'extérieur
  useEffect(() => {
    setText(value > 0 ? String(value) : '');
  }, [value]);

  const barWidth = barAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const barColor = reached ? C.green : color;

  return (
    <View style={{
      width: 140, height: 140,
      backgroundColor: '#0A0800', borderRadius: 20,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: reached ? color + '66' : 'rgba(255,255,255,0.07)',
    }}>
      {/* Icône grande en absolute - ne pousse rien */}
      <Image
        source={icon}
        style={{ position: 'absolute', width: 110, height: 110, top: -10, left: 15, opacity: 0.9 }}
        resizeMode="contain"
      />
      {/* Texte + barre collés en bas, centrés */}
      <View style={{ position: 'absolute', bottom: 12, left: 0, right: 0, alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
          <TextInput
            style={{ fontFamily: 'SpaceMono', fontSize: 22, color: reached ? C.green : C.text, fontWeight: '700', padding: 0, textAlign: 'center' }}
            value={text}
            onChangeText={t => { setText(t); }}
            onEndEditing={() => {
              const n = parseFloat(text.replace(',', '.'));
              onChange(isNaN(n) ? undefined : n);
              if (isNaN(n)) setText('');
            }}
            placeholder="—"
            placeholderTextColor="rgba(255,255,255,0.2)"
            keyboardType={keyboardType}
            returnKeyType="done"
          />
          {unit ? <Text style={{ fontSize: 10, color: C.dim, marginBottom: 2 }}>{unit}</Text> : null}
        </View>
        <Text style={{ fontSize: 9, color: C.dim, letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 2, textAlign: 'center' }}>{label}</Text>
        <View style={{ height: 2, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 1, width: '80%', overflow: 'hidden', marginTop: 6 }}>
          <Animated.View style={{ height: '100%', borderRadius: 1, width: barWidth, backgroundColor: barColor }} />
        </View>
      </View>
    </View>
  );
}

// ─── HabitOrb ─────────────────────────────────────────────────────────────────
const ORB_SIZE = 72;

const HABIT_IMG_OFFSETS: Record<string, object> = {
  calories_ok:   { marginTop: 6 },
  m_face:        { marginTop: 6 },
  learning_done: { marginRight: 6 },
};

function HabitOrb({ habitKey, label, active, onPress }: {
  habitKey: string; label: string; active: boolean; onPress: () => void;
}) {
  const scale      = useRef(new Animated.Value(1)).current;
  const glowAnim   = useRef(new Animated.Value(active ? 1 : 0)).current;
  const checkScale = useRef(new Animated.Value(active ? 1 : 0)).current;
  const [burst, setBurst] = useState(false);

  useEffect(() => {
    Animated.timing(glowAnim,   { toValue: active ? 1 : 0, duration: 250, useNativeDriver: false }).start();
    Animated.spring(checkScale, { toValue: active ? 1 : 0, tension: 200, friction: 8, useNativeDriver: true }).start();
  }, [active]);

  function handlePress() {
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.82, tension: 500, friction: 8, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1.08, tension: 200, friction: 7, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1,    tension: 180, friction: 10, useNativeDriver: true }),
    ]).start();
    if (!active) { setBurst(true); setTimeout(() => setBurst(false), 600); }
    onPress();
  }

  const borderCol = glowAnim.interpolate({ inputRange: [0, 1], outputRange: ['#2a2520', GOLD] });
  const bgCol     = glowAnim.interpolate({ inputRange: [0, 1], outputRange: ['rgba(0,0,0,0)', GOLD + '18'] });

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={1} style={{ alignItems: 'center', width: ORB_SIZE + 20 }}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Animated.View style={{
          width: ORB_SIZE, height: ORB_SIZE,
          borderRadius: ORB_SIZE / 2,
          borderWidth: active ? 2 : 1.5,
          borderColor: borderCol,
          backgroundColor: bgCol,
          alignItems: 'center', justifyContent: 'center',
        }}>
          {HABIT_IMAGES[habitKey] && (
            <Image
              source={HABIT_IMAGES[habitKey]}
              style={{ width: ORB_SIZE * 0.75, height: ORB_SIZE * 0.75, opacity: active ? 1 : 0.35, alignSelf: 'center', ...HABIT_IMG_OFFSETS[habitKey] }}
              resizeMode="contain"
            />
          )}
          {active && (
            <Animated.View style={{
              position: 'absolute', bottom: -2, right: -2,
              width: 16, height: 16, borderRadius: 8,
              backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center',
              opacity: checkScale,
              transform: [{ scale: checkScale }],
            }}>
              <Text style={{ color: '#000', fontSize: 9, fontWeight: '800' }}>✓</Text>
            </Animated.View>
          )}
        </Animated.View>
      </Animated.View>
      <Text style={{
        fontSize: 8, marginTop: 6, textAlign: 'center', color: active ? GOLD : C.dim,
        letterSpacing: 0.5, fontWeight: active ? '700' : '400',
      }} numberOfLines={2}>
        {label.split(' ')[0].toUpperCase()}
      </Text>
      <Text style={{ fontSize: 7, color: active ? C.green : C.dim, textAlign: 'center' }}>
        {active ? '1/1' : '0/1'}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const gender = useGender(user?.id);

  useFocusEffect(useCallback(() => {
    if (!user?.id) return;
    supabase.from('profiles').select('name, xp_penalty').eq('id', user.id).single()
      .then(({ data }) => { if (data) setProfile(data); });
  }, [user?.id]));

  const { play, stop } = useSound();
  const { shieldDates, syncShields } = useStreakShields(user?.id);
  const { pausedDates } = usePause(user?.id);
  const { playAmbient } = useAmbientSound();

  useFocusEffect(useCallback(() => {
    playAmbient('accueil');
  }, []));
  const { day, history, streak, updateDay } = useDay(user?.id, [...shieldDates, ...pausedDates]);
  const { status: inactivity } = useInactivity(user?.id, profile?.name ?? '', gender);

  useEffect(() => {
    if (day && history) syncShields(day, history);
  }, [day?.date, history.length]);
  const insets = useSafeAreaInsets();

  const [xpPopups, setXpPopups]         = useState<{id: number; xp: number}[]>([]);
  const [milestoneToShow, setMilestone]  = useState<any>(null);
  const [showPerfectDay, setShowPerfect] = useState(false);
  const [showEveningSummary, setEvening] = useState(false);
  const [levelUpRank, setLevelUpRank]    = useState<any>(null);
  const [completedQuests, setCompletedQ] = useState<Set<string>>(new Set());
  const [questBanner, setQuestBanner]    = useState<Quest | null>(null);
  const [showQuests, setShowQuests]      = useState(false);
  const [showNotif,  setShowNotif]       = useState(false);
  const { evening } = useLocalSearchParams<{ evening?: string }>();
  const prevDone    = useRef(0);
  const prevStreak  = useRef(streak);
  const prevRankLvl = useRef<number | null>(null);
  const doneScale   = useRef(new Animated.Value(1)).current;
  const xpGainAnim  = useRef(new Animated.Value(0)).current;
  const heroScale   = useRef(new Animated.Value(1)).current;

  // Hero breathing
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(heroScale, { toValue: 1.03, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(heroScale, { toValue: 1,    duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);

  // Stagger entrance
  const stagger = useRef([0,1,2,3,4,5].map(() => new Animated.Value(0))).current;
  useEffect(() => {
    setTimeout(() => {
      Animated.stagger(80, stagger.map(a =>
        Animated.spring(a, { toValue: 1, tension: 50, friction: 12, useNativeDriver: true })
      )).start();
    }, 200);
  }, []);
  const S = (i: number) => ({
    opacity: stagger[i],
    transform: [{ translateY: stagger[i].interpolate({ inputRange: [0,1], outputRange: [24, 0] }) }],
  });

  const xpPenalty  = (profile as any)?.xp_penalty ?? 0;
  const calTarget  = (profile as any)?.cal_target  ?? 2300;
  const protTarget = (profile as any)?.prot_target ?? 180;
  const totalXP   = Math.max(0, calcTotalXP([...history.filter(h => h.date !== day.date), day]) - xpPenalty);
  const rank      = getRank(totalXP) ?? { level: 1, name: 'NOVICE', color: GOLD, minXP: 0 };
  const RANK_TIERS = RANKS.filter((r, i) => i === 0 || r.name !== RANKS[i - 1].name);
  const rankTierIndex = (RANK_TIERS.findIndex(r => r.name === rank.name) + 1) || 1; // 1-10
  const score     = calcScore(day);
  const done      = HABIT_KEYS.filter(k => !!day[k as keyof typeof day]).length;
  const isFemale  = gender === 'female';
  const userName  = profile?.name ?? (isFemale ? 'Guerrière' : 'Guerrier');
  const todayQuests = adaptQuestsForGender(getTodayQuests(inactivity.isReturning), gender);
  const nextMilestone = getNextMilestone(streak);
  const currentMilestone = getCurrentMilestone(streak);
  const { showRecap, recapData, closeRecap } = useWeeklyRecap(user?.id);

  // Done animation
  useEffect(() => {
    if (done > prevDone.current) {
      doneScale.setValue(0.85);
      Animated.spring(doneScale, { toValue: 1, tension: 120, friction: 10, useNativeDriver: true }).start();
      if (done === 6) {
        const key = `@aegis:perfect_day_${new Date().toISOString().split('T')[0]}`;
        AsyncStorage.getItem(key).then(shown => {
          if (!shown) {
            setShowPerfect(true);
            play('perfectday');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            AsyncStorage.setItem(key, 'true');
            setTimeout(() => setShowPerfect(false), 3500);
          }
        });
      }
    }
    prevDone.current = done;
  }, [done]);

  // Streak milestone
  useEffect(() => {
    if (streak > prevStreak.current && currentMilestone) {
      const newM = STREAK_MILESTONES.find((m: any) => m.days === streak);
      if (newM) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); setMilestone(newM); play('badge'); }
    }
    prevStreak.current = streak;
  }, [streak]);

  // Rank up
  useEffect(() => {
    if (totalXP === 0) return;
    AsyncStorage.getItem('@aegis:last_rank_level').then(stored => {
      const prev = stored ? parseInt(stored) : null;
      if (prev === null) { AsyncStorage.setItem('@aegis:last_rank_level', String(rank.level)); prevRankLvl.current = rank.level; return; }
      if (rank.level > prev && prev > 0) { setLevelUpRank(rank); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }
      AsyncStorage.setItem('@aegis:last_rank_level', String(rank.level));
      prevRankLvl.current = rank.level;
    });
  }, [rank.level]);

  // Quest detection
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    todayQuests.forEach(async quest => {
      if (completedQuests.has(quest.id)) return;
      if (!quest.check(day)) return;
      const key = `@aegis:quest_${quest.id}_${today}`;
      const already = await AsyncStorage.getItem(key);
      if (already) { setCompletedQ(prev => new Set([...prev, quest.id])); return; }
      await AsyncStorage.setItem(key, 'true');
      setCompletedQ(prev => new Set([...prev, quest.id]));
      const isPerfect = done >= 6;
      setTimeout(() => setQuestBanner(quest), isPerfect ? 3000 : 0);
      play('badge');
    });
  }, [day]);

  useEffect(() => {
    if (evening === '1') setEvening(true);
  }, [evening]);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 20) return;
    const key = `@aegis:evening_summary_${new Date().toISOString().split('T')[0]}`;
    AsyncStorage.getItem(key).then(shown => {
      if (!shown) { setEvening(true); AsyncStorage.setItem(key, 'true'); }
    });
  }, []);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const load = async () => {
      const done = new Set<string>();
      for (const q of getTodayQuests(inactivity.isReturning)) {
        const val = await AsyncStorage.getItem(`@aegis:quest_${q.id}_${today}`);
        if (val) done.add(q.id);
      }
      setCompletedQ(done);
    };
    load();
  }, [user, inactivity.isReturning]);

  function showXP(xp: number) {
    const id = Date.now();
    setXpPopups(p => [...p, { id, xp }]);
    setTimeout(() => setXpPopups(p => p.filter(x => x.id !== id)), 1500);
    xpGainAnim.setValue(1);
    Animated.timing(xpGainAnim, { toValue: 0, duration: 1400, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }

  async function toggleHabit(key: string) {
    const current = !!(day as any)[key];
    const updates: any = { [key]: !current };
    if (key === 'm_face') {
      updates.m_face = !current; updates.m_hydra = !current; updates.m_skin = !current;
      updates.e_face = !current; updates.e_hydra = !current; updates.e_skin = !current;
    }
    await updateDay(updates);
    if (!current) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      play('habit');
      const xpMap: any = { workout_done: 40, calories_ok: 20, learning_done: 25, m_face: 15, outfit_ok: 10, morning_water: 10 };
      if (xpMap[key]) showXP(xpMap[key]);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }

  // XP popup
  if (xpPopups.length > 0) {
    // rendered in absolute overlay below
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0800' }}>

      {/* XP Popups */}
      <View style={{ position: 'absolute', top: 120, right: 20, zIndex: 999, alignItems: 'flex-end' }}>
        {xpPopups.map(({ id, xp }) => (
          <XPPopup key={id} xp={xp} />
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} bounces contentContainerStyle={{ paddingBottom: 16 }}>

        {/* ── HERO ── */}
        <View style={{ height: height * 0.55, position: 'relative' }}>
          <Animated.Image
            source={HERO_IMG}
            style={{ width: '100%', height: '100%', transform: [{ scale: heroScale }] }}
            resizeMode="cover"
          />
          {/* Gradient overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(7,6,10,0.3)', 'rgba(7,6,10,0.85)', '#07060A']}
            locations={[0.2, 0.5, 0.75, 1]}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Top — salut + icons */}
          <View style={{
            position: 'absolute', top: insets.top + 12,
            left: 20, right: 20,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ color: GOLD, fontSize: 10 }}>✦</Text>
              <Text style={{ fontSize: 10, color: GOLD, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '700' }}>
                SALUT, {userName.toUpperCase()}
              </Text>
              <Text style={{ color: GOLD, fontSize: 10 }}>✦</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <TouchableOpacity onPress={() => setShowNotif(true)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.5)', borderWidth: 1, borderColor: GOLD + '44', alignItems: 'center', justifyContent: 'center' }}>
                <Image source={require('@/assets/ui/icone_notif.png')} style={{ width: 60, height: 60 }} resizeMode="contain" />
              </TouchableOpacity>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.5)', borderWidth: 1, borderColor: GOLD + '44', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontFamily: 'Cinzel', fontSize: 12, color: GOLD }}>A</Text>
              </View>
            </View>
          </View>

          {/* Bottom — tagline */}
          <View style={{ position: 'absolute', bottom: 32, left: 20, right: 20 }}>
            <Text style={{ fontSize: 34, color: C.text, fontWeight: '800', lineHeight: 40, marginBottom: 8 }}>
              Deviens ta{'\n'}
              <Text style={{ color: GOLDB }}>meilleure</Text> version.
            </Text>
            <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 20 }}>
              Discipline aujourd'hui,{'\n'}liberté demain.
            </Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: 16 }}>

          {/* ── XP / NIVEAU / STREAK ── */}
          <Animated.View style={[S(0), {
            backgroundColor: '#050300',
            borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
            padding: 18, marginBottom: 14,
          }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>

              {/* Badge niveau */}
              {/* Badge niveau - médaille */}
              <View style={{ alignItems: 'center', width: 56 }}>
                <Image source={RANK_MEDALS[rankTierIndex] ?? RANK_MEDALS[1]} style={{ width: 56, height: 56 }} resizeMode="contain" />
                <Text style={{ fontFamily: 'Cinzel', fontSize: 11, color: GOLD, fontWeight: '700', marginTop: 3 }}>NIV. {rank.level}</Text>
              </View>

              {/* Rang + XP */}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 9, color: C.dim, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 2 }}>NIVEAU</Text>
                <Text style={{ fontFamily: 'Cinzel', fontSize: 16, color: GOLDB, letterSpacing: 2 }}>{rank.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                  <XPFillBar
                    totalXP={totalXP}
                    level={rank.level}
                    progress={getXPProgress(totalXP)}
                    color={GOLD}
                    height={8}
                    style={{ flex: 1 }}
                  />
                </View>
              </View>

              {/* XP du jour */}
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 9, color: C.dim, letterSpacing: 2, textTransform: 'uppercase' }}>XP DU JOUR</Text>
                <Text style={{ fontFamily: 'SpaceMono', fontSize: 20, color: C.text, marginTop: 2 }}>{calcDayXP(day)}</Text>
                <Text style={{ fontSize: 9, color: C.dim }}>/ 2500</Text>
              </View>

              {/* Séparateur */}
              <View style={{ width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.08)' }} />

              {/* Streak */}
              <View style={{ alignItems: 'center', width: 26 }}>
                <StreakFlame days={streak} compact size={34} />
              </View>

            </View>
          </Animated.View>

          {/* ── MISSION DU JOUR ── */}
          <Animated.View style={[S(1), { marginBottom: 14 }]}>
            <View style={{ borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: GOLD + '33' }}>
              {/* Image de fond */}
              <Image source={BG_MISSION} style={{ position: 'absolute', width: '100%', height: '100%' }} resizeMode="cover" />
              <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(7,5,0,0.78)' }} />

              <View style={{ padding: 20 }}>
                {/* Header */}
                <Text style={{ fontSize: 9, color: GOLD, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 10, fontWeight: '700' }}>
                  MISSION DU JOUR
                </Text>

                <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    {/* Mission input */}
                    <TextInput
                      style={{
                        fontSize: 24, color: C.text, fontWeight: '800',
                        lineHeight: 30, minHeight: 30, marginBottom: 16,
                      }}
                      value={day.daily_goal || ''}
                      onChangeText={(v: string) => updateDay({ daily_goal: v })}
                      placeholder={isFemale ? "Forgée par la discipline." : "Forgé par la discipline."}
                      placeholderTextColor="rgba(255,255,255,0.25)"
                      multiline
                    />

                    {/* Checklist mission */}
                    {[
                      { key: 'workout_done', label: 'Séance d\'entraînement', count: `${done >= 1 ? 1 : 0}/1` },
                      { key: null, label: '6 habitudes complétées', count: `${done}/6` },
                      { key: 'learning_done', label: 'Lecture / Apprentissage', count: `${day.learning_done ? 1 : 0}/1` },
                    ].map((item, i) => (
                      <View key={i} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          <View style={{
                            width: 20, height: 20, borderRadius: 10,
                            borderWidth: 1.5,
                            borderColor: (item.key ? !!(day as any)[item.key] : done >= 6) ? GOLD : 'rgba(255,255,255,0.2)',
                            backgroundColor: (item.key ? !!(day as any)[item.key] : done >= 6) ? GOLD + '22' : 'transparent',
                            alignItems: 'center', justifyContent: 'center',
                          }}>
                            {(item.key ? !!(day as any)[item.key] : done >= 6) && (
                              <Text style={{ color: GOLD, fontSize: 9, fontWeight: '800' }}>✓</Text>
                            )}
                          </View>
                          <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{item.label}</Text>
                        </View>
                        <Text style={{ fontSize: 11, color: C.dim, fontFamily: 'SpaceMono' }}>{item.count}</Text>
                      </View>
                    ))}
                  </View>

                </View>
              </View>
            </View>
          </Animated.View>

          {/* ── STAT TILES ── */}
          <Animated.View style={[S(2), { marginBottom: 14 }]}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 0, gap: 10 }}
            >
              <StatTile
                icon={STAT_ICONS.calories}
                value={day.calories ?? 0}
                target={calTarget}
                unit="" label="Calories" color={C.red}
                onChange={v => updateDay({ calories: v })}
              />
              <StatTile
                icon={STAT_ICONS.entrainement}
                value={day.cardio_min ?? 0}
                target={60}
                unit="min" label="Entraîn." color={GOLD}
                onChange={v => updateDay({ cardio_min: v })}
              />
              <StatTile
                icon={STAT_ICONS.lecture}
                value={day.learning_min ? parseFloat((day.learning_min / 60).toFixed(1)) : 0}
                target={1}
                unit="h" label="Lecture" color='#8B5CF6'
                keyboardType="decimal-pad"
                onChange={v => updateDay({ learning_min: v ? Math.round(v * 60) : undefined })}
              />
              <StatTile
                icon={STAT_ICONS.eau}
                value={day.water_liters ?? 0}
                target={2}
                unit="L" label="Eau" color='#38BDF8'
                keyboardType="decimal-pad"
                onChange={v => updateDay({ water_liters: v })}
              />
            </ScrollView>
          </Animated.View>

          {/* ── HABITUDES ── */}
          <Animated.View style={[S(3), { marginBottom: 14 }]}>
            <Text style={{ fontSize: 11, color: GOLDB, letterSpacing: 3, textTransform: 'uppercase', fontWeight: '700', marginBottom: 14 }}>Habitudes</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 4, gap: 16 }}
            >
              {HABIT_KEYS.map(k => (
                <HabitOrb
                  key={k as string}
                  habitKey={k as string}
                  label={HABIT_LABELS[k as string]}
                  active={!!(day as any)[k as string]}
                  onPress={() => toggleHabit(k as string)}
                />
              ))}
            </ScrollView>
          </Animated.View>

          {/* ── QUÊTES — bannière cliquable ── */}
          <Animated.View style={[S(4), { marginBottom: 14 }]}>
            <TouchableOpacity onPress={() => setShowQuests(true)} activeOpacity={0.88}>
              <View style={{
                borderRadius: 18, overflow: 'hidden',
                borderWidth: 1, borderColor: GOLD + '44',
              }}>
                <Image source={BG_MISSION} style={{ position: 'absolute', width: '100%', height: '100%' }} resizeMode="cover" />
                <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(7,5,0,0.80)' }} />
                <View style={{ padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  {/* Badge progression */}
                  <View style={{ width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: GOLD, backgroundColor: GOLD + '22', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontFamily: 'SpaceMono', fontSize: 16, color: GOLD, fontWeight: '700' }}>
                      {todayQuests.filter(q => completedQuests.has(q.id) || q.check(day)).length}/{todayQuests.length}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 9, color: GOLD, letterSpacing: 3, textTransform: 'uppercase', fontWeight: '700', marginBottom: 4 }}>QUÊTES DU JOUR</Text>
                    <Text style={{ fontSize: 15, color: C.text, fontWeight: '700' }}>
                      {todayQuests.filter(q => completedQuests.has(q.id) || q.check(day)).length === todayQuests.length
                        ? 'Toutes les quêtes complétées !'
                        : 'Accomplir mes quêtes du jour'}
                    </Text>
                    {todayQuests.reduce((acc, q) => acc + ((completedQuests.has(q.id) || q.check(day)) ? q.xp : 0), 0) > 0 && (
                      <Text style={{ fontFamily: 'SpaceMono', fontSize: 12, color: GOLD, marginTop: 4 }}>
                        +{todayQuests.reduce((acc, q) => acc + ((completedQuests.has(q.id) || q.check(day)) ? q.xp : 0), 0)} XP gagnés
                      </Text>
                    )}
                  </View>
                  <Text style={{ color: GOLD, fontSize: 22 }}>›</Text>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* ── CITATION ── */}
          <Animated.View style={[S(5), { marginBottom: 24 }]}>
            <View style={{ borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' }}>
              <Image source={BG_QUOTE} style={{ position: 'absolute', width: '100%', height: '100%' }} resizeMode="cover" />
              <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(4,3,8,0.82)' }} />
              <View style={{ padding: 20, flexDirection: 'row', gap: 14, alignItems: 'flex-start' }}>
                <Text style={{ fontFamily: 'Cinzel', fontSize: 28, color: GOLD, lineHeight: 28, marginTop: -4 }}>❝</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, color: C.text, lineHeight: 22, fontStyle: 'italic' }}>
                    La discipline est le pont entre{'\n'}
                    <Text style={{ color: GOLDB }}>tes objectifs et leur accomplissement.</Text>
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>

        </View>
      </ScrollView>

      {/* Modals */}
      {milestoneToShow && <MilestoneModal milestone={milestoneToShow} onClose={() => setMilestone(null)} />}
      {questBanner && <QuestBanner quest={questBanner} onDismiss={() => setQuestBanner(null)} />}
      <PerfectDayCelebration trigger={showPerfectDay} />
      {levelUpRank && <LevelUpModal rank={levelUpRank} gender={gender} onClose={() => { stop('levelup'); setLevelUpRank(null); }} />}
      {showEveningSummary && <EveningSummary done={done} total={HABIT_KEYS.length} onDismiss={() => setEvening(false)} />}
      <WeeklyRecapModal visible={showRecap} data={recapData} onClose={closeRecap} />
      <QuestsScreen
        visible={showQuests}
        onClose={() => setShowQuests(false)}
        quests={todayQuests}
        day={day}
        completedIds={completedQuests}
        streak={streak}
      />
      <Modal visible={showNotif} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: C.bg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: C.s3 }}>
            <TouchableOpacity onPress={() => setShowNotif(false)}>
              <Text style={{ color: C.dim, fontSize: 14 }}>Fermer</Text>
            </TouchableOpacity>
            <Text style={{ fontFamily: 'Cinzel', fontSize: 15, color: GOLDB, letterSpacing: 2 }}>NOTIFICATIONS</Text>
            <View style={{ width: 60 }} />
          </View>
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <NotificationSettings />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

// ─── XPPopup ──────────────────────────────────────────────────────────────────
function XPPopup({ xp }: { xp: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.timing(anim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(800),
      Animated.timing(anim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={{
      opacity: anim,
      transform: [{ translateY: anim.interpolate({ inputRange: [0,1], outputRange: [10, -20] }) }],
      marginBottom: 4,
    }}>
      <Text style={{ fontFamily: 'SpaceMono', fontSize: 20, fontWeight: '700', color: GOLD }}>+{xp} XP</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({});
