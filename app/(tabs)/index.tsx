import { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Image, Dimensions, ActivityIndicator,
  Animated, Easing, Modal, TextInput,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import EveningSummary from '@/components/EveningSummary';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useDay } from '@/hooks/useDay';
import { Card, SectionTitle, ScoreRing, Inp, ToggleRow, ActionRow } from '@/components/ui';
import { XPBar, RankBadge } from '@/components/XPBar';
import { C } from '@/constants/colors';
import { HABIT_KEYS, HABIT_LABELS, calcScore } from '@/constants/types';
import {
  calcTotalXP, calcDayXP, getRank,
  QUOTES, getCurrentMilestone, getNextMilestone,
} from '@/constants/rpg';
import { supabase } from '@/lib/supabase';
import WeeklyRecapModal from '@/components/WeeklyRecapModal';
import { useWeeklyRecap } from '@/hooks/useWeeklyRecap';
import PerfectDayCelebration from '@/components/PerfectDayCelebration';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { getDailyQuote } from '@/constants/quotes';
import QuoteCard from '@/components/QuoteCard';
import MedalBadge from '@/components/MedalBadge';
import LevelUpModal from '@/components/LevelUpModal';
import DailyQuests from '@/components/DailyQuests';
import QuestBanner from '@/components/QuestBanner';
import { getTodayQuests, type Quest } from '@/constants/quests';
import { useSound } from '@/hooks/useSound';

const { width } = Dimensions.get('window');

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
      transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [10, -20] }) }],
      marginBottom: 4,
    }}>
      <Text style={{ fontFamily: 'SpaceMono', fontSize: 20, fontWeight: '700', color: C.gold }}>+{xp} XP</Text>
    </Animated.View>
  );
}

function MilestoneModal({ milestone, onClose }: { milestone: any; onClose: () => void }) {
  const { STREAK_MILESTONES } = require('@/constants/rpg');
  const idx = STREAK_MILESTONES.findIndex((m: any) => m.days === milestone.days);

  return (
    <Modal visible transparent animationType="fade">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center', padding: 32 }}>
        <View style={{ backgroundColor: C.s1, borderRadius: 24, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: milestone.color + '44', width: '100%' }}>
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


// ─── Config habitudes ─────────────────────────────────────────────────────────
const HABIT_CONFIG: Record<string, { icon: string; color: string; xp: number }> = {
  workout_done:  { icon: '⚔️', color: C.gold,     xp: 40 },
  calories_ok:   { icon: '🍎', color: C.gold,     xp: 20 },
  learning_done: { icon: '📚', color: C.gold,     xp: 25 },
  m_face:        { icon: '✨', color: C.gold,     xp: 15 },
  outfit_ok:     { icon: '👕', color: C.gold,     xp: 10 },
  morning_water: { icon: '💧', color: C.gold,     xp: 10 },
};

// ─── HabitOrb — cercle collectible, grille 3×2 ───────────────────────────────
// Règle driver : scale + opacity = native | bg/border = JS
const { width: SCREEN_W } = require('react-native').Dimensions.get('window');
const ORB_SIZE = Math.floor((SCREEN_W - 48 - 4 * 10) / 3);  // 3 colonnes

function HabitOrb({ habitKey, label, active, onPress }: {
  habitKey: string; label: string; active: boolean; onPress: () => void;
}) {
  const cfg         = HABIT_CONFIG[habitKey] ?? { icon: '✦', color: C.gold, xp: 10 };
  const scale       = useRef(new Animated.Value(1)).current;      // native
  const glowOpacity = useRef(new Animated.Value(active ? 1 : 0)).current; // native
  const ringColor   = useRef(new Animated.Value(active ? 1 : 0)).current; // JS
  const checkScale  = useRef(new Animated.Value(active ? 1 : 0)).current; // native

  useEffect(() => {
    Animated.timing(ringColor,   { toValue: active ? 1 : 0, duration: 250, useNativeDriver: false }).start();
    Animated.spring(glowOpacity, { toValue: active ? 1 : 0, tension: 120, friction: 10, useNativeDriver: true }).start();
    Animated.spring(checkScale,  { toValue: active ? 1 : 0, tension: 200, friction: 8,  useNativeDriver: true }).start();
  }, [active]);

  function handlePress() {
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.82, tension: 500, friction: 8,  useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1.08, tension: 200, friction: 7,  useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1,    tension: 180, friction: 10, useNativeDriver: true }),
    ]).start();
    onPress();
  }

  const borderCol = ringColor.interpolate({
    inputRange: [0, 1], outputRange: [C.s3, cfg.color],
  });
  const bgCol = ringColor.interpolate({
    inputRange: [0, 1], outputRange: ['transparent', cfg.color + '18'],
  });

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={1}
      style={{ width: ORB_SIZE, alignItems: 'center', paddingVertical: 4 }}>
      <Animated.View style={{ transform: [{ scale }] }}>
        {/* Glow halo — native driver */}
        <Animated.View style={{
          position: 'absolute',
          width: ORB_SIZE - 4, height: ORB_SIZE - 4,
          borderRadius: (ORB_SIZE - 4) / 2,
          backgroundColor: cfg.color,
          opacity: glowOpacity.interpolate({ inputRange: [0, 1], outputRange: [0, 0.22] }),
          transform: [{ scale: 1.2 }],
          top: 2, left: 2,
        }} />

        {/* Cercle principal — JS driver (couleurs) */}
        <Animated.View style={{
          width: ORB_SIZE - 4, height: ORB_SIZE - 4,
          borderRadius: (ORB_SIZE - 4) / 2,
          borderWidth: active ? 2 : 1.5,
          borderColor: borderCol,
          backgroundColor: bgCol,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={{ fontSize: ORB_SIZE * 0.34 }}>{cfg.icon}</Text>

          {/* Checkmark — native driver */}
          <Animated.View style={{
            position: 'absolute', bottom: 4, right: 4,
            width: 18, height: 18, borderRadius: 9,
            backgroundColor: cfg.color,
            alignItems: 'center', justifyContent: 'center',
            opacity: checkScale,
            transform: [{ scale: checkScale.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 1.3, 1] }) }],
          }}>
            <Text style={{ color: '#000', fontSize: 10, fontWeight: '800' }}>✓</Text>
          </Animated.View>
        </Animated.View>
      </Animated.View>

      {/* Label sous le cercle */}
      <Text style={{
        fontSize: 9, marginTop: 6, textAlign: 'center', lineHeight: 12,
        color: active ? cfg.color : C.dim,
        fontWeight: active ? '600' : '400',
        letterSpacing: 0.3,
      }} numberOfLines={2}>
        {label.split(' ').slice(0, 2).join('\n')}
      </Text>
    </TouchableOpacity>
  );
}


// ─── ScoreCard — Bronze → Or Blanc progressif ─────────────────────────────────
// doneAnim : JS driver (interpolation couleurs bg/border/text)
// glowAnim : native driver (opacity uniquement — glow pulsant jour parfait)
const PERF_BORDER = ['#6B4F10','#8B6519','#A07524','#B98E2E','#CDA83A','#DFC050','#F5E890'];
const PERF_BG     = ['#080500','#0A0700','#0C0900','#0F0B00','#120E00','#161200','#1C1600'];

function ScoreCard({ done, score, scoreLabel }: { done: number; score: number; scoreLabel: string }) {
  const doneAnim = useRef(new Animated.Value(done)).current; // JS — couleurs
  const glowAnim = useRef(new Animated.Value(0)).current;   // native — opacity

  // Transition fluide entre états de couleur
  useEffect(() => {
    Animated.spring(doneAnim, {
      toValue: done,
      tension: 50, friction: 14,
      useNativeDriver: false,
    }).start();
  }, [done]);

  // Glow pulsant uniquement quand jour parfait
  useEffect(() => {
    if (done === 6) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1,   duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0.2, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      Animated.timing(glowAnim, { toValue: 0, duration: 400, useNativeDriver: true }).start();
    }
  }, [done]);

  const IR = [0,1,2,3,4,5,6];
  const borderColor = doneAnim.interpolate({ inputRange: IR, outputRange: PERF_BORDER, extrapolate: 'clamp' });
  const bgColor     = doneAnim.interpolate({ inputRange: IR, outputRange: PERF_BG,     extrapolate: 'clamp' });
  const textColor   = doneAnim.interpolate({ inputRange: IR, outputRange: PERF_BORDER, extrapolate: 'clamp' });

  return (
    <View style={{ flex: 1.15, borderRadius: 16, overflow: 'hidden' }}>

      {/* Glow overlay — native driver uniquement (opacity) */}
      <Animated.View style={{
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#F5E890',
        opacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.10] }),
        borderRadius: 16,
      }} />

      {/* Carte principale — JS driver (bg + border en couleurs interpolées) */}
      <Animated.View style={{
        flex: 1,
        backgroundColor: bgColor,
        borderWidth: done >= 5 ? 1.5 : 1,
        borderColor: borderColor,
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: '#F5E090',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: done >= 4 ? 0.25 + done * 0.08 : 0,
        shadowRadius: done >= 4 ? done * 3 : 0,
        elevation: done >= 4 ? done : 0,
      }}>
        <ScoreRing score={score} />

        <Animated.Text style={{
          fontFamily: 'Cinzel', fontSize: 9,
          letterSpacing: 2, textAlign: 'center',
          color: textColor,
        }}>
          {scoreLabel}
        </Animated.Text>

        {/* Badge PARFAIT — visible seulement quand done=6, pulse via glowAnim */}
        {done === 6 && (
          <Animated.View style={{
            borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
            borderWidth: 1, borderColor: '#F5E890',
            backgroundColor: '#F5E89011',
            opacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }),
          }}>
            <Text style={{ fontSize: 8, color: '#F5E890', fontWeight: '700', letterSpacing: 1 }}>
              PARFAIT ✦
            </Text>
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );
}

const missionStyles = StyleSheet.create({
  card: {
    backgroundColor: '#0A0800',
    borderWidth: 1,
    borderColor: C.goldDim,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  input: {
    color: C.text,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 56,
    textAlignVertical: 'top',
    fontStyle: 'italic',
  },
});

export default function DashboardScreen() {
  const { user } = useAuth();
  const { play, stop } = useSound();
  const { day, history, streak, updateDay } = useDay(user?.id);
  const insets = useSafeAreaInsets();
  const HERO_H = 280 + insets.top;


  const [heroUri, setHeroUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [xpPopups, setXpPopups] = useState<number[]>([]);
  const [milestoneToShow, setMilestoneToShow] = useState<any>(null);
  const [showPerfectDay, setShowPerfectDay] = useState(false);
  const [showEveningSummary, setShowEveningSummary] = useState(false);
  const [levelUpRank, setLevelUpRank] = useState<any>(null);
  const prevRankLevel = useRef<number | null>(null);
  const [completedQuests, setCompletedQuests] = useState<Set<string>>(new Set());
  const [questBanner, setQuestBanner] = useState<Quest | null>(null);
  const todayQuests = getTodayQuests();
  const { evening } = useLocalSearchParams<{ evening?: string }>();
  const prevStreak = useRef(streak);
  const doneScale  = useRef(new Animated.Value(1)).current;
  const prevDone   = useRef(0);

  const { showRecap, recapData, closeRecap } = useWeeklyRecap(user?.id);

  // Déclenche EveningSummary si ouvert depuis tap notif soir
  useEffect(() => {
    if (evening === '1') setShowEveningSummary(true);
  }, [evening]);

  // Détection complétion des quêtes
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    todayQuests.forEach(async quest => {
      if (completedQuests.has(quest.id)) return;
      if (!quest.check(day)) return;

      const key = `@aegis:quest_${quest.id}_${today}`;
      const already = await AsyncStorage.getItem(key);
      if (already) {
        setCompletedQuests(prev => new Set([...prev, quest.id]));
        return;
      }

      // Nouvelle complétion
      await AsyncStorage.setItem(key, 'true');
      setCompletedQuests(prev => new Set([...prev, quest.id]));
      setQuestBanner(quest);
      play('badge');
    });
  }, [day]);

  // Détection level up — persiste le rang dans AsyncStorage pour détecter entre sessions
  useEffect(() => {
    if (totalXP === 0) return;
    const key = '@aegis:last_rank_level';
    AsyncStorage.getItem(key).then(stored => {
      const prev = stored ? parseInt(stored) : null;
      if (prev === null) {
        // Premier lancement — on stocke sans déclencher
        AsyncStorage.setItem(key, String(rank.level));
        prevRankLevel.current = rank.level;
        return;
      }
      if (rank.level > prev) {
        // Level up détecté !
        setLevelUpRank(rank);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 500);
        AsyncStorage.setItem(key, String(rank.level));
      }
      prevRankLevel.current = rank.level;
    });
  }, [totalXP]);

  const totalXP = calcTotalXP([...history.filter(h => h.date !== day.date), day]);
  const rank = getRank(totalXP);
  const score = calcScore(day);
  const done = HABIT_KEYS.filter(k => !!day[k as keyof typeof day]).length;
  const quote = getDailyQuote();
  const dateStr = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase();
  const currentMilestone = getCurrentMilestone(streak);
  const nextMilestone = getNextMilestone(streak);
  const scoreLabel = done === 6 ? 'JOUR PARFAIT' : score >= 70 ? 'DISCIPLINÉ' : score >= 40 ? 'EN MARCHE' : 'À DÉMARRER';
  

  // ── Thème dynamique ──────────────────────────────────────────────────────
  // Niveau 0 = < 40% | Niveau 1 = 40-69% | Niveau 2 = 70-89% | Niveau 3 = 90-100%
  const disciplineLevel = score >= 90 ? 3 : score >= 70 ? 2 : score >= 40 ? 1 : 0;

  const dynTheme = {
    // Fond hero quand pas de photo — légèrement plus chaud selon niveau
    heroBg: ['#070707', '#0A0800', '#0D0A00', '#110C00'][disciplineLevel],
    // Bordure de la XP bar
    xpBorder: [
      rank.color + '22',
      rank.color + '44',
      rank.color + '66',
      rank.color + '99',
    ][disciplineLevel],
    // Fond de la XP bar
    xpBg: [
      rank.color + '04',
      rank.color + '08',
      rank.color + '0D',
      rank.color + '14',
    ][disciplineLevel],
    // Intensité du glow sur la bordure gauche de la citation
    quoteAccent: ['#5A4520', '#7A5A28', '#9A7232', '#C9A84C'][disciplineLevel],
    // Opacité du gradient hero
    heroGradient: [
      ['rgba(7,7,7,0.05)', 'rgba(7,7,7,0.55)', 'rgba(7,7,7,1)'],
      ['rgba(12,9,0,0.05)', 'rgba(10,8,0,0.55)', 'rgba(7,7,7,1)'],
      ['rgba(18,13,0,0.05)', 'rgba(14,11,0,0.55)', 'rgba(7,7,7,1)'],
      ['rgba(24,18,0,0.05)', 'rgba(18,14,0,0.55)', 'rgba(7,7,7,1)'],
    ][disciplineLevel] as [string, string, string],
  };

  useEffect(() => {
    if (!user) return;
    const { data } = supabase.storage.from('avatar').getPublicUrl(`hero_${user.id}.jpg`);
    if (data?.publicUrl) setHeroUri(data.publicUrl);

    // Charge les quêtes déjà complétées aujourd'hui
    const today = new Date().toISOString().split('T')[0];
    const loadCompleted = async () => {
      const done = new Set<string>();
      for (const q of getTodayQuests()) {
        const val = await AsyncStorage.getItem(`@aegis:quest_${q.id}_${today}`);
        if (val) done.add(q.id);
      }
      setCompletedQuests(done);
    };
    loadCompleted();
  }, [user]);

  // Résumé du soir automatique — après 20h au premier lancement
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 20) return;
    const todayKey = `@aegis:evening_summary_${new Date().toISOString().split('T')[0]}`;
    AsyncStorage.getItem(todayKey).then(shown => {
      if (!shown) {
        setShowEveningSummary(true);
        AsyncStorage.setItem(todayKey, 'true');
      }
    });
  }, []);
 
  useEffect(() => {
  if (streak > prevStreak.current && currentMilestone) {
    const { STREAK_MILESTONES } = require('@/constants/rpg');
    const newMilestone = STREAK_MILESTONES.find((m: any) => m.days === streak);
    if (newMilestone) {
      // ✅ Milestone streak → notification forte
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setMilestoneToShow(newMilestone);
      play('badge'); // ← ajoute
    }
  }
  prevStreak.current = streak;
}, [streak]);


useEffect(() => {
  if (done > prevDone.current) {
    doneScale.setValue(0.85);
    Animated.spring(doneScale, {
      toValue: 1,
      tension: 120,
      friction: 10,
      useNativeDriver: true,
    }).start();

    // Détection Perfect Day — montré une seule fois par jour
    if (done === 6) {
      const todayKey = `@aegis:perfect_day_${new Date().toISOString().split('T')[0]}`;
      AsyncStorage.getItem(todayKey).then(shown => {
        if (!shown) {
          setShowPerfectDay(true);
          play('perfectday'); // ← ajoute
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 200);
          AsyncStorage.setItem(todayKey, 'true');
          // Reset après 3.5s
          setTimeout(() => setShowPerfectDay(false), 3500);
        }
      });
    }
  }
  prevDone.current = done;
}, [done]);

  async function pickHero() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.7 });
    if (result.canceled || !user) return;
    const uri = result.assets[0].uri;
    setHeroUri(uri);
    setUploading(true);
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const arr = await new Response(blob).arrayBuffer();
      const { error } = await supabase.storage.from('avatar').upload(`hero_${user.id}.jpg`, new Uint8Array(arr), { contentType: 'image/jpeg', upsert: true });
      if (!error) {
        const { data } = supabase.storage.from('avatar').getPublicUrl(`hero_${user.id}.jpg`);
        setHeroUri(data.publicUrl + '?t=' + Date.now());
      }
    } catch {}
    setUploading(false);
  }

  function showXP(xp: number) {
    const id = Date.now();
    setXpPopups(p => [...p, id]);
    setTimeout(() => setXpPopups(p => p.filter(x => x !== id)), 1500);
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
    // ✅ Habitude validée → impact moyen satisfaisant
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      play('habit'); // ← ajoute

    const xpMap: any = { workout_done: 40, calories_ok: 20, learning_done: 25, m_face: 15, outfit_ok: 10, morning_water: 10 };
    if (xpMap[key]) showXP(xpMap[key]);
  } else {
    // ✅ Habitude décochée → léger
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ position: 'absolute', top: 100, right: 20, zIndex: 999, alignItems: 'flex-end' }}>
        {xpPopups.map(id => <XPPopup key={id} xp={40} />)}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HERO */}
        <View style={{ height: HERO_H }}>
          {heroUri
            ? <Image source={{ uri: heroUri }} style={{ width, height: HERO_H, resizeMode: 'cover' }} />
            : <View style={{ width, height: HERO_H, backgroundColor: dynTheme.heroBg, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 60, color: C.goldDim }}>✦</Text>
              </View>
          }
          <LinearGradient colors={['rgba(7,7,7,0.05)', 'rgba(7,7,7,0.5)', 'rgba(7,7,7,1)']} style={StyleSheet.absoluteFillObject} />
          <View style={{ position: 'absolute', top: insets.top + 12, left: 16 }}>
            <RankBadge totalXP={totalXP} />
          </View>
          <TouchableOpacity onPress={pickHero} style={{ position: 'absolute', bottom: 18, right: 16, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: C.goldDim }} disabled={uploading}>
            {uploading ? <ActivityIndicator color={C.gold} size="small" /> : <Text>📷</Text>}
          </TouchableOpacity>
          <View style={{ position: 'absolute', bottom: 20, left: 20, right: 56 }}>
            <Text style={{ fontFamily: 'Cinzel', fontSize: 28, color: C.goldBright, letterSpacing: 6 }}>AEGIS</Text>
            <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 5, letterSpacing: 2 }}>{dateStr}</Text>
          </View>
        </View>

        <View style={{ padding: 16 }}>
          {/* QUOTE */}
          <QuoteCard quote={quote} accentColor={dynTheme.quoteAccent} />

          {/* XP BAR */}
          <Card style={{ borderColor: dynTheme.xpBorder, backgroundColor: dynTheme.xpBg }}>
            <XPBar totalXP={totalXP} />
          </Card>

          {/* SCORE ROW — 3 cartes visuelles */}
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>

            <ScoreCard done={done} score={score} scoreLabel={scoreLabel} />

            {/* ── Colonne droite ── */}
            <View style={{ flex: 1, gap: 10 }}>

              {/* Streak */}
              <View style={{
                flex: 1,
                backgroundColor: streak >= 3 ? '#120A00' : C.s1,
                borderWidth: 1,
                borderColor: streak >= 7 ? C.gold + '88' : streak >= 3 ? C.gold + '44' : C.s3,
                borderRadius: 16, padding: 14,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                  {streak >= 3 && <Text style={{ fontSize: 14 }}>🔥</Text>}
                  <Text style={{ fontFamily: 'SpaceMono', fontSize: 24, lineHeight: 26, color: streak > 0 ? C.gold : C.dim }}>
                    {streak}
                  </Text>
                  <Text style={{ fontSize: 12, color: C.dim }}>j</Text>
                </View>
                <Text style={{ fontSize: 9, color: C.dim, marginTop: 2, letterSpacing: 2, textTransform: 'uppercase' }}>Streak</Text>
                {nextMilestone && streak > 0 && (
                  <>
                    <View style={{ height: 2, backgroundColor: C.s3, borderRadius: 1, marginTop: 8, overflow: 'hidden' }}>
                      <View style={{
                        height: 2, borderRadius: 1, backgroundColor: C.gold,
                        width: `${Math.min(Math.round((streak / nextMilestone.days) * 100), 100)}%` as any,
                      }} />
                    </View>
                    <Text style={{ fontSize: 8, color: C.dim, marginTop: 3 }}>
                      {nextMilestone.days - streak}j → {nextMilestone.title}
                    </Text>
                  </>
                )}
              </View>

              {/* Habitudes */}
              <View style={{
                flex: 1,
                backgroundColor: done === 6 ? '#001A0A' : done >= 3 ? '#110C00' : C.s1,
                borderWidth: 1,
                borderColor: done === 6 ? C.green + '66' : done >= 3 ? C.gold + '33' : C.s3,
                borderRadius: 16, padding: 14,
              }}>
                <Animated.View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2, transform: [{ scale: doneScale }] }}>
                  <Text style={{ fontFamily: 'SpaceMono', fontSize: 22, lineHeight: 24, color: done === 6 ? C.green : done >= 3 ? C.gold : C.text }}>
                    {done}
                  </Text>
                  <Text style={{ fontSize: 12, color: C.dim }}>/6</Text>
                </Animated.View>
                <Text style={{ fontSize: 9, color: C.dim, marginTop: 2, letterSpacing: 2, textTransform: 'uppercase' }}>Habitudes</Text>
                <View style={{ flexDirection: 'row', gap: 3, marginTop: 8 }}>
                  {[0,1,2,3,4,5].map(i => (
                    <View key={i} style={{
                      flex: 1, height: 3, borderRadius: 2,
                      backgroundColor: i < done ? (done === 6 ? C.green : C.gold) : C.s3,
                    }} />
                  ))}
                </View>
                <Text style={{ fontSize: 8, color: done === 6 ? C.green : C.gold, marginTop: 4 }}>+{calcDayXP(day)} XP</Text>
              </View>

            </View>
          </View>

          {/* HABITUDES — grille 3×2 */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 10, color: C.goldBright, letterSpacing: 3, textTransform: 'uppercase', fontWeight: '700' }}>
              Habitudes
            </Text>
            <Text style={{ fontFamily: 'SpaceMono', fontSize: 11, color: done >= 6 ? C.green : C.gold }}>
              {done}/6 · +{calcDayXP(day)} XP
            </Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20, justifyContent: 'space-between' }}>
            {HABIT_KEYS.map(k => {
              const key = k as string;
              const active = !!(day as any)[key];
              return (
                <HabitOrb
                  key={key}
                  habitKey={key}
                  label={HABIT_LABELS[key]}
                  active={active}
                  onPress={() => toggleHabit(key)}
                />
              );
            })}
          </View>

          {/* MISSION DU JOUR */}
          <View style={missionStyles.card}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Text style={{ fontFamily: 'Cinzel', color: C.goldBright, fontSize: 10, letterSpacing: 4 }}>MISSION DU JOUR</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: C.goldDim }} />
              <Text style={{ fontFamily: 'Cinzel', color: day.daily_goal?.trim() ? C.green : C.goldDim, fontSize: 9, letterSpacing: 1 }}>
                {day.daily_goal?.trim() ? '✓ DÉFINIE' : 'À DÉFINIR'}
              </Text>
            </View>

            {/* Champ mission */}
            <TextInput
              style={missionStyles.input}
              value={day.daily_goal || ''}
              onChangeText={(v: string) => updateDay({ daily_goal: v })}
              placeholder="Qu'est-ce que tu dois accomplir aujourd'hui ?"
              placeholderTextColor={C.dim}
              multiline
              blurOnSubmit
            />

            {/* Séparateur */}
            <View style={{ height: 1, backgroundColor: C.s3, marginVertical: 14 }} />

            {/* Actions rapides avec ActionRow */}
            <ActionRow
              icon="💧" label="Eau au réveil"
              active={!!day.morning_water}
              onPress={v => updateDay({ morning_water: v })}
            />
            <ActionRow
              icon="📚" label="Apprentissage"
              sub="Lecture, podcast, cours..."
              active={!!day.learning_done}
              onPress={v => updateDay({ learning_done: v })}
            />
          </View>

          {/* QUÊTES DU JOUR */}
          <DailyQuests
            quests={todayQuests}
            day={day}
            completedIds={completedQuests}
          />
        </View>
      </ScrollView>

      {milestoneToShow && (
        <MilestoneModal milestone={milestoneToShow} onClose={() => setMilestoneToShow(null)} />
      )}

      {questBanner && (
        <QuestBanner quest={questBanner} onDismiss={() => setQuestBanner(null)} />
      )}

      <PerfectDayCelebration trigger={showPerfectDay} />

      {levelUpRank && (
        <LevelUpModal rank={levelUpRank} onClose={() => { stop('levelup'); setLevelUpRank(null); }} />
      )}

      {showEveningSummary && (
        <EveningSummary
          done={done}
          total={HABIT_KEYS.length}
          onDismiss={() => setShowEveningSummary(false)}
        />
      )}

      <WeeklyRecapModal
  visible={showRecap}
  data={recapData}
  onClose={closeRecap}
/>
    </View>
  );
}
