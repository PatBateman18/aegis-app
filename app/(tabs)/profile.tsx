import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import {
  View, Text, ScrollView, TouchableOpacity,
  Dimensions, Modal, TextInput, Animated, Easing,
  KeyboardAvoidingView, Platform, Alert, Image, StyleSheet, Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useDay } from '@/hooks/useDay';
import { useStreakShields } from '@/hooks/useStreakShields';
import { usePause } from '@/hooks/usePause';
import { useMentor } from '@/hooks/useMentor';
import { getMentor } from '@/constants/mentors';
import MentorScreen from '@/components/MentorScreen';
import { useAmbientSound } from '@/hooks/useAmbientSound';
import { supabase } from '@/lib/supabase';
import { useGender } from '@/hooks/useGender';
import { C } from '@/constants/colors';
import { calcTotalXP, getRank, RANKS, STREAK_MILESTONES, getXPProgress, getXPNeeded } from '@/constants/rpg';
import MedalBadge from '@/components/MedalBadge';
import VoyageModal from '@/components/VoyageModal';
import AchievementsScreen from '@/components/AchievementsScreen';
import SoundSettingsScreen from '@/components/SoundSettingsScreen';
import RanksScreen from '@/components/RanksScreen';
import { useInactivity } from '@/hooks/useInactivity';
import NotificationSettings from '@/components/NotifSettings';
import { calcScore, HABIT_KEYS, HABIT_LABELS } from '@/constants/types';
import { XPFillBar } from '@/components/XPFillBar';

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
import { StreakFlame } from '@/components/StreakFlame';

const { width, height } = Dimensions.get('window');
const GOLD  = '#C9A84C';
const GOLDB = '#E8C46A';
const GOLDD = '#C9A84C22';

const HERO_IMG = require('@/assets/hero/hero_profil.png');

const RANK_IMGS: Record<string, any> = {
  'NOVICE':     require('@/assets/ranks/rank_novice.png'),
  'INITIÉ':     require('@/assets/ranks/rank_initie.png'),
  'DISCIPLE':   require('@/assets/ranks/rank_disciple.png'),
  'GUERRIER':   require('@/assets/ranks/rank_guerrier.png'),
  'STRATÈGE':   require('@/assets/ranks/rank_stratege.png'),
  'CONQUÉRANT': require('@/assets/ranks/rank_conquerant.png'),
  'CHAMPION':   require('@/assets/ranks/rank_champion.png'),
  'MAÎTRE':     require('@/assets/ranks/rank_maitre.png'),
  'ÉLITE':      require('@/assets/ranks/rank_elite.png'),
  'AEGIS':      require('@/assets/ranks/rank_aegis.png'),
};

const RANK_IMGS_FEMALE: Record<string, any> = {
  'NOVICE':     require('@/assets/ranks/rank_novice_femme.png'),
  'INITIÉ':     require('@/assets/ranks/rank_initie_femme.png'),
  'DISCIPLE':   require('@/assets/ranks/rank_disciple_femme.png'),
  'GUERRIER':   require('@/assets/ranks/rank_guerrier_femme.png'),
  'STRATÈGE':   require('@/assets/ranks/rank_stratege_femme.png'),
  'CONQUÉRANT': require('@/assets/ranks/rank_conquerant_femme.png'),
  'CHAMPION':   require('@/assets/ranks/rank_champion_femme.png'),
  'MAÎTRE':     require('@/assets/ranks/rank_maitre_femme.png'),
  'ÉLITE':      require('@/assets/ranks/rank_elite_femme.png'),
  'AEGIS':      require('@/assets/ranks/rank_aegis_femme.png'),
};

const FEMALE_RANK_NAMES: Record<string, string> = {
  'INITIÉ': 'INITIÉE', 'GUERRIER': 'GUERRIÈRE',
  'CONQUÉRANT': 'CONQUÉRANTE', 'CHAMPION': 'CHAMPIONNE', 'MAÎTRE': 'MAÎTRESSE',
};
function rankDisplayName(name: string, gender: string): string {
  return gender === 'female' ? (FEMALE_RANK_NAMES[name] ?? name) : name;
}

const HABIT_ICONS: Record<string, string> = {
  workout_done: '⚡', calories_ok: '🔥', learning_done: '📚',
  m_face: '✨', outfit_ok: '👔', morning_water: '💧',
};

// ─── EditProfileModal ─────────────────────────────────────────────────────────
function EditProfileModal({ profile, onClose, onSave }: { profile: any; onClose: () => void; onSave: (d: any) => void }) {
  const [name, setName] = useState(profile?.name ?? '');
  const [cal,  setCal]  = useState(String(profile?.cal_target ?? 2300));
  const [prot, setProt] = useState(String(profile?.prot_target ?? 180));
  function handleSave() {
    if (!name.trim()) return Alert.alert('Entre ton prénom');
    const cn = parseInt(cal), pn = parseInt(prot);
    if (isNaN(cn) || cn < 1000 || cn > 5000) return Alert.alert('Calories invalides');
    if (isNaN(pn) || pn < 50  || pn > 400)  return Alert.alert('Protéines invalides');
    onSave({ name: name.trim(), cal_target: cn, prot_target: pn });
    onClose();
  }
  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: C.s3 }}>
          <TouchableOpacity onPress={onClose}><Text style={{ color: C.dim, fontSize: 14 }}>Annuler</Text></TouchableOpacity>
          <Text style={{ fontFamily: 'Cinzel', fontSize: 16, color: GOLDB, letterSpacing: 2 }}>MON COMPTE</Text>
          <TouchableOpacity onPress={handleSave}><Text style={{ color: GOLD, fontSize: 14, fontWeight: '700' }}>Sauver</Text></TouchableOpacity>
        </View>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={{ padding: 24 }}>
            <Text style={{ fontFamily: 'Cinzel', fontSize: 14, color: GOLD, letterSpacing: 2, marginBottom: 16 }}>Identité</Text>
            <Text style={{ fontSize: 10, color: C.dim, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Prénom</Text>
            <TextInput style={{ backgroundColor: C.s2, borderWidth: 1, borderColor: C.s3, borderRadius: 10, padding: 14, color: C.text, fontSize: 15, marginBottom: 16 }} value={name} onChangeText={setName} placeholder="Ton prénom" placeholderTextColor={C.dim} autoCorrect={false} />
            <Text style={{ fontFamily: 'Cinzel', fontSize: 14, color: GOLD, letterSpacing: 2, marginTop: 8, marginBottom: 16 }}>Objectifs nutritionnels</Text>
            <Text style={{ fontSize: 10, color: C.dim, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Calories / jour</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <TextInput style={{ flex: 1, backgroundColor: C.s2, borderWidth: 1, borderColor: C.s3, borderRadius: 10, padding: 14, color: C.text, fontSize: 15 }} value={cal} onChangeText={setCal} keyboardType="numeric" placeholder="2300" placeholderTextColor={C.dim} />
              <Text style={{ color: C.dim, fontSize: 13, width: 36 }}>kcal</Text>
            </View>
            <Text style={{ fontSize: 10, color: C.dim, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Protéines / jour</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <TextInput style={{ flex: 1, backgroundColor: C.s2, borderWidth: 1, borderColor: C.s3, borderRadius: 10, padding: 14, color: C.text, fontSize: 15 }} value={prot} onChangeText={setProt} keyboardType="numeric" placeholder="180" placeholderTextColor={C.dim} />
              <Text style={{ color: C.dim, fontSize: 13, width: 36 }}>g</Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ─── MonthPickerModal ─────────────────────────────────────────────────────────
function MonthPickerModal({ current, history, createdAt, onSelect, onClose }: any) {
  const months: { month: number; year: number }[] = [];
  const cursor = new Date(); cursor.setDate(1);
  // Date de début = premier historique ou création du compte
  const earliest = createdAt ? new Date(createdAt) : history?.length > 0
    ? new Date([...history].sort((a: any, b: any) => a.date.localeCompare(b.date))[0].date)
    : new Date(cursor.getFullYear(), cursor.getMonth() - 11, 1);
  earliest.setDate(1);

  while (cursor >= earliest) {
    months.push({ month: cursor.getMonth(), year: cursor.getFullYear() });
    cursor.setMonth(cursor.getMonth() - 1);
  }
  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: C.s3 }}>
          <TouchableOpacity onPress={onClose}><Text style={{ color: C.dim, fontSize: 14 }}>Fermer</Text></TouchableOpacity>
          <Text style={{ fontFamily: 'Cinzel', fontSize: 16, color: GOLDB, letterSpacing: 2 }}>CHOISIR UN MOIS</Text>
          <View style={{ width: 60 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {months.map(({ month, year }) => {
            const isSelected = month === current.month && year === current.year;
            const label = new Date(year, month, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
            return (
              <TouchableOpacity key={`${year}-${month}`}
                style={{ backgroundColor: isSelected ? GOLDD : C.s1, borderWidth: 1, borderColor: isSelected ? GOLD : C.s3, borderRadius: 12, padding: 16, marginBottom: 10 }}
                onPress={() => { onSelect(month, year); onClose(); }}>
                <Text style={{ fontFamily: 'Cinzel', fontSize: 14, color: isSelected ? GOLDB : C.text, textTransform: 'capitalize' }}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── ProfileScreen ─────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const router = useRouter();
  const { user, profile, updateProfile, signOut } = useAuth();
  const { shields, shieldDates, syncShields } = useStreakShields(user?.id);
  const { pausedDates, pauseUntil, isPauseActive, startPause, cancelPause } = usePause(user?.id);
  const { playAmbient, enabled: ambientEnabled, setEnabled: setAmbientEnabled } = useAmbientSound();

  useFocusEffect(useCallback(() => {
    playAmbient('profil');
  }, []));
  const { day, history, streak, loadHistory, loadToday, updateDay } = useDay(user?.id, [...shieldDates, ...pausedDates]);

  useEffect(() => {
    if (day && history) syncShields(day, history);
  }, [day?.date, history.length]);
  const gender   = useGender(user?.id);
  const { mentorId, setMentorId } = useMentor(user?.id, gender);
  const currentMentor = getMentor(mentorId);
  const [showMentor, setShowMentor] = useState(false);
  const isFemale = gender === 'female';
  const rankImgs = isFemale ? RANK_IMGS_FEMALE : RANK_IMGS;

  const [showEdit,          setShowEdit]          = useState(false);
  const [showMonthPicker,   setShowMonthPicker]   = useState(false);
  const [showSettings,      setShowSettings]      = useState(false);

  async function confirmDeleteAccount() {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        Alert.alert('Erreur', 'Session introuvable — reconnecte-toi et réessaie.');
        return;
      }

      const { error } = await supabase.functions.invoke('delete-account', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (error) {
        console.error('[delete-account] failed:', error);
        Alert.alert('Erreur', "La suppression a échoué. Réessaie, ou contacte le support si ça persiste.");
        return;
      }

      await signOut();
    } catch (e) {
      console.error('[delete-account] exception:', e);
      Alert.alert('Erreur', 'Une erreur est survenue. Réessaie plus tard.');
    }
  }

  function handleDeleteAccount() {
    Alert.alert(
      'Supprimer ton compte ?',
      'Toutes tes données seront définitivement effacées : habitudes, photos, objectifs, succès, statistiques. Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Continuer',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Es-tu vraiment sûr ?',
              'Dernière confirmation — cette suppression ne peut pas être annulée.',
              [
                { text: 'Annuler', style: 'cancel' },
                { text: 'Supprimer définitivement', style: 'destructive', onPress: confirmDeleteAccount },
              ]
            );
          },
        },
      ]
    );
  }
  const [showPauseModal,    setShowPauseModal]    = useState(false);
  const [showVoyage,        setShowVoyage]        = useState(false);
  const [showAchievements,  setShowAchievements]  = useState(false);
  const [showRanks,         setShowRanks]         = useState(false);
  const [showNotifSettings, setShowNotifSettings] = useState(false);
  const [showSoundSettings, setShowSoundSettings] = useState(false);
  const [selectedMonth,     setSelectedMonth]     = useState(new Date().getMonth());
  const [selectedYear,      setSelectedYear]      = useState(new Date().getFullYear());
  const [unlockedMilestones,setUnlockedMilestones]= useState<Set<number>>(new Set());
  const [xpPenalty, setXpPenalty] = useState(0);
  const [extendedHistory, setExtendedHistory] = useState<any[]>([]);
  const [statsRange, setStatsRange] = useState<'week' | 'month' | '6months' | 'year' | 'all'>('month');

  useFocusEffect(useCallback(() => {
    if (!user?.id) return;
    supabase.from('daily_logs').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(400)
      .then(({ data, error }) => {
        if (error) console.error('[Profile] extendedHistory load failed:', error);
        if (data) setExtendedHistory(data);
      });
  }, [user?.id]));
  const [journalText, setJournalText] = useState(day.journal || '');
  const journalTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Resynchronise le champ local si le journal change depuis ailleurs (changement de jour, reload...)
  // mais jamais pendant que l'utilisateur est en train de taper.
  useEffect(() => {
    if (journalTimer.current == null) setJournalText(day.journal || '');
  }, [day.journal]);

  function onJournalChange(v: string) {
    setJournalText(v); // instantané, aucun aller-retour réseau ici
    if (journalTimer.current) clearTimeout(journalTimer.current);
    journalTimer.current = setTimeout(() => {
      updateDay({ journal: v });
      journalTimer.current = null;
    }, 600);
  }
  const { status: inactivity } = useInactivity(user?.id, profile?.name ?? '');
  const heroScale = useRef(new Animated.Value(1)).current;
  const insets = useSafeAreaInsets();

  useFocusEffect(useCallback(() => {
    if (user?.id) { loadHistory(); loadToday(); }
  }, [user?.id]));

  useFocusEffect(useCallback(() => {
    if (!user?.id) return;
    supabase.from('profiles').select('xp_penalty').eq('id', user.id).single()
      .then(({ data }) => { if (data) setXpPenalty((data as any).xp_penalty ?? 0); });
  }, [user?.id]));

  useEffect(() => {
    async function load() {
      const u = new Set<number>();
      for (const m of STREAK_MILESTONES) {
        if (await AsyncStorage.getItem(`@aegis:milestone_shown_${m.days}`)) u.add(m.days);
      }
      setUnlockedMilestones(u);
    }
    load();
  }, []);

  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(heroScale, { toValue: 1.03, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(heroScale, { toValue: 1,    duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);

  // Stagger
  const stagger = useRef([0,1,2,3,4,5,6].map(() => new Animated.Value(0))).current;
  useEffect(() => {
    setTimeout(() => {
      Animated.stagger(80, stagger.map(a =>
        Animated.spring(a, { toValue: 1, tension: 50, friction: 12, useNativeDriver: true })
      )).start();
    }, 200);
  }, []);
  const S = (i: number) => ({
    opacity: stagger[i],
    transform: [{ translateY: stagger[i].interpolate({ inputRange: [0,1], outputRange: [20, 0] }) }],
  });

  if (!user) return null;

  const allDays   = [...history.filter(h => h.date !== day.date), day];
  const totalXP   = Math.max(0, calcTotalXP(allDays) - xpPenalty);
  const rank      = getRank(totalXP);
  const totalDays = history.length;
  // Liste ordonnée des 10 paliers de rang (noms uniques, dans l'ordre d'apparition)
  const RANK_TIERS = RANKS.filter((r, i) => i === 0 || r.name !== RANKS[i - 1].name);
  const rankTierIndex = RANK_TIERS.findIndex(r => r.name === rank.name) + 1; // 1-10
  const nextRank  = RANK_TIERS[rankTierIndex] ?? null; // le prochain palier de nom, ou null si AEGIS
  const xpNeeded  = nextRank ? nextRank.minXP - totalXP : 0;

  const bestStreak = (() => {
    let best = 0, cur = 0;
    for (const d of [...history].sort((a, b) => a.date.localeCompare(b.date))) {
      if (calcScore(d) >= 40) { cur++; best = Math.max(best, cur); } else cur = 0;
    }
    return best;
  })();

  const avgRegularity = totalDays > 0
    ? Math.round(allDays.reduce((a, d) => a + calcScore(d), 0) / allDays.length)
    : 0;

  const RANGE_DAYS: Record<typeof statsRange, number | null> = {
    week: 7, month: 30, '6months': 182, year: 365, all: null,
  };
  const rangeCutoff = (() => {
    const days = RANGE_DAYS[statsRange];
    if (days == null) return null;
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
  })();
  const rangedAllDays = [...extendedHistory.filter((h: any) => h.date !== day.date), day]
    .filter((d: any) => !rangeCutoff || d.date >= rangeCutoff);
  const rangedTotalDays = rangedAllDays.length;

  const habitStats = HABIT_KEYS.map(k => ({
    key: k as string,
    label: HABIT_LABELS[k as string],
    pct: rangedTotalDays > 0 ? Math.round((rangedAllDays.filter((d: any) => !!d[k]).length / rangedTotalDays) * 100) : 0,
  })).sort((a, b) => b.pct - a.pct);

  // Heatmap
  const today        = new Date().toISOString().split('T')[0];
  const heatmapW  = Math.floor((width - 32 - 10) / 2) - 28; // moitié écran moins padding carte
  const cellSize  = Math.floor((heatmapW - 6 * 3) / 7);
  const monthDays    = (() => {
    const isCurrentMonth = selectedMonth === new Date().getMonth() && selectedYear === new Date().getFullYear();
    const lastDay = isCurrentMonth ? new Date().getDate() : new Date(selectedYear, selectedMonth + 1, 0).getDate();
    // Offset : quel jour de semaine est le 1er du mois (0=Lun, 6=Dim)
    const firstDow = (new Date(selectedYear, selectedMonth, 1).getDay() + 6) % 7;
    const cells: any[] = [];
    // Cases vides pour aligner
    for (let i = 0; i < firstDow; i++) cells.push({ empty: true, day: -i });
    // Cases réelles
    for (let i = 1; i <= lastDay; i++) {
      const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const log = dateStr === today ? day : history.find(h => h.date === dateStr);
      const score = log ? calcScore(log) : 0;
      cells.push({ day: i, dateStr, score, isPerfect: score === 100, isToday: dateStr === today });
    }
    return cells;
  })();

  // 7 derniers jours
  const today7 = (() => {
    const now = new Date();
    const daysFromMon = (now.getDay() + 6) % 7;
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now); d.setDate(now.getDate() - daysFromMon + i);
      const ds = d.toISOString().split('T')[0];
      const log = ds === today ? day : history.find(h => h.date === ds);
      const isFuture = d > now;
      return { ds, dayName: ['L','M','M','J','V','S','D'][i], done: !isFuture && log ? calcScore(log) >= 40 : false, isFuture };
    });
  })();

  const monthLabel = new Date(selectedYear, selectedMonth, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }).toUpperCase();
  const userName   = profile?.name ?? (isFemale ? 'Guerrière' : 'Guerrier');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#07060A' }} edges={[]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* ── HERO ── */}
        <View style={{ height: height * 0.5, position: 'relative', overflow: 'hidden' }}>
          <Animated.Image source={HERO_IMG} style={{ width: '100%', height: '100%', transform: [{ scale: heroScale }, { scale: 1.5 }, { translateY: -110 }] }} resizeMode="cover" />
          <LinearGradient colors={['transparent', 'rgba(7,6,10,0.3)', 'rgba(7,6,10,0.88)', '#07060A']} locations={[0.2, 0.5, 0.78, 1]} style={StyleSheet.absoluteFillObject} />

          {/* Top icons */}
          <View style={{ position: 'absolute', top: insets.top + 12, right: 16, flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity onPress={() => setShowSettings(true)} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.5)', borderWidth: 1, borderColor: GOLD + '44', alignItems: 'center', justifyContent: 'center' }}>
              <Image source={require('@/assets/ui/icone_parametres.png')} style={{ width: 34, height: 34, transform: [{ translateX: -1 }, { translateY: 1 }] }} resizeMode="contain" />
            </TouchableOpacity>
            <TouchableOpacity style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.5)', borderWidth: 1, borderColor: GOLD + '44', alignItems: 'center', justifyContent: 'center' }}>
              <Image source={require('@/assets/ui/icone_notif.png')} style={{ width: 60, height: 60 }} resizeMode="contain" />
            </TouchableOpacity>
          </View>

          {/* Label */}
          <View style={{ position: 'absolute', top: insets.top + 18, left: 20, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 10, color: GOLD, letterSpacing: 3, textTransform: 'uppercase', fontWeight: '700' }}>PROFIL</Text>
          </View>

          {/* Bas hero */}
          <View style={{ position: 'absolute', bottom: 28, left: 20, right: 20 }}>
            <Text style={{ fontFamily: 'Cinzel', fontSize: 38, color: C.text, fontWeight: '800', letterSpacing: 3, textTransform: 'uppercase' }}>{userName}</Text>
            <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', marginTop: 4 }}>
              "Discipline aujourd'hui, liberté demain."
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 }}>
              <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: GOLD + '33', borderWidth: 1, borderColor: GOLD, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontFamily: 'Cinzel', fontSize: 7, color: GOLD }}>A</Text>
              </View>
              <Text style={{ fontFamily: 'Cinzel', fontSize: 11, color: GOLD, letterSpacing: 2 }}>{rankDisplayName(rank.name, gender)}</Text>
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: 16 }}>

          {/* ── NIVEAU XP ── */}
          <Animated.View style={[S(0), {
            backgroundColor: '#0A0800', borderRadius: 20,
            borderWidth: 1, borderColor: GOLD + '33', padding: 18, marginBottom: 14,
          }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              {/* Badge */}
              <View style={{ alignItems: 'center', width: 64 }}>
                <Image source={RANK_MEDALS[rankTierIndex] ?? RANK_MEDALS[1]} style={{ width: 64, height: 64 }} resizeMode="contain" />
                <Text style={{ fontFamily: 'Cinzel', fontSize: 13, color: GOLD, fontWeight: '700', marginTop: 4 }}>NIV. {rank.level}</Text>
              </View>
              {/* Info gauche */}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 9, color: C.dim, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 2 }}>NIVEAU ACTUEL</Text>
                <Text style={{ fontFamily: 'Cinzel', fontSize: 18, color: GOLDB, letterSpacing: 2 }}>{rankDisplayName(rank.name, gender)}</Text>
                <XPFillBar
                  totalXP={totalXP}
                  level={rank.level}
                  progress={getXPProgress(totalXP)}
                  color={GOLD}
                  height={8}
                  style={{ marginTop: 8 }}
                />
                <Text style={{ fontSize: 9, color: C.dim, marginTop: 4 }}>{totalXP.toLocaleString()} / {nextRank ? nextRank.minXP.toLocaleString() : '—'} XP</Text>
              </View>
              {/* Info droite */}
              {nextRank && (
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 9, color: C.dim, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>PROCHAIN</Text>
                  <Image source={RANK_MEDALS[rankTierIndex + 1] ?? RANK_MEDALS[1]} style={{ width: 36, height: 36, marginBottom: 4 }} resizeMode="contain" />
                  <Text style={{ fontFamily: 'Cinzel', fontSize: 11, color: nextRank.color + 'AA', letterSpacing: 1 }}>{rankDisplayName(nextRank.name, gender)}</Text>
                  <Text style={{ fontSize: 9, color: C.dim, marginTop: 2 }}>{xpNeeded} XP</Text>
                </View>
              )}
            </View>
          </Animated.View>

          {/* ── TUILE MENTOR ── */}
          <TouchableOpacity onPress={() => setShowMentor(true)} activeOpacity={0.7}>
            <Animated.View style={[S(1), {
              flexDirection: 'row', alignItems: 'center', gap: 14,
              backgroundColor: '#0A0800', borderRadius: 16,
              borderWidth: 1, borderColor: GOLD + '22',
              padding: 14, marginBottom: 14,
            }]}>
              <Image
                source={currentMentor.portrait}
                style={{ width: 48, height: 48, borderRadius: 24 }}
                resizeMode="cover"
              />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 9, color: C.dim, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 2 }}>TON MENTOR</Text>
                <Text style={{ fontFamily: 'Cinzel', fontSize: 14, color: GOLDB, letterSpacing: 1 }}>{currentMentor.name}</Text>
              </View>
              <Text style={{ color: C.dim, fontSize: 18 }}>›</Text>
            </Animated.View>
          </TouchableOpacity>

          {/* ── STREAK + RÉGULARITÉ ── */}
          <Animated.View style={[S(1), { flexDirection: 'row', gap: 10, marginBottom: 14 }]}>
            {/* Streak */}
            <View style={{ flex: 1, backgroundColor: '#0A0800', borderRadius: 16, borderWidth: 1, borderColor: GOLD + '22', padding: 12 }}>
              <StreakFlame
                days={streak}
                weekCompleted={today7.map(d => d.done)}
                size={44}
                horizontal
              />
              <Text style={{ fontSize: 9, color: C.dim, textAlign: 'center', marginTop: 8 }}>Meilleur : {bestStreak} jours</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 3, marginTop: 6 }}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <Text key={i} style={{ fontSize: 12, opacity: i < shields ? 1 : 0.25 }}>🛡</Text>
                ))}
              </View>
              {isPauseActive ? (
                <TouchableOpacity onPress={() => setShowPauseModal(true)} style={{ marginTop: 8, alignItems: 'center' }}>
                  <Text style={{ fontSize: 9, color: GOLD, fontWeight: '700' }}>En pause jusqu'au {pauseUntil}</Text>
                  <Text style={{ fontSize: 8, color: C.dim, marginTop: 1 }}>Toucher pour annuler</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={() => setShowPauseModal(true)} style={{ marginTop: 8, alignItems: 'center' }}>
                  <Text style={{ fontSize: 9, color: C.dim, textDecorationLine: 'underline' }}>Annoncer une pause</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Régularité */}
            <View style={{ flex: 1, backgroundColor: '#0A0800', borderRadius: 16, borderWidth: 1, borderColor: GOLD + '22', padding: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <Text style={{ fontSize: 9, color: GOLD, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '700' }}>RÉGULARITÉ</Text>
                <TouchableOpacity onPress={() => setShowMonthPicker(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={{ fontSize: 9, color: C.dim }}>{monthLabel.slice(0,7)}</Text>
                  <Text style={{ color: GOLD, fontSize: 9 }}>▾</Text>
                </TouchableOpacity>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                {['L','M','M','J','V','S','D'].map((d, i) => (
                  <Text key={i} style={{ fontSize: 8, color: C.dim, width: cellSize, textAlign: 'center' }}>{d}</Text>
                ))}
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 3 }}>
                {monthDays.map((d, i) => (
                  <View key={i} style={{
                    width: cellSize, height: cellSize, borderRadius: 3,
                    backgroundColor: d.empty ? 'transparent' : d.isPerfect ? GOLDB : d.score >= 70 ? GOLD + '88' : d.score >= 40 ? GOLD + '44' : d.score > 0 ? GOLD + '22' : 'rgba(255,255,255,0.06)',
                    borderWidth: !d.empty && d.isToday ? 1 : 0, borderColor: GOLDB,
                  }} />
                ))}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                <Text style={{ fontSize: 7, color: C.dim }}>- actif</Text>
                <View style={{ flexDirection: 'row', gap: 2 }}>
                  {['rgba(255,255,255,0.06)', GOLD + '22', GOLD + '44', GOLD + '88', GOLDB].map((col, i) => (
                    <View key={i} style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: col }} />
                  ))}
                </View>
                <Text style={{ fontSize: 7, color: C.dim }}>+ actif</Text>
              </View>
            </View>
          </Animated.View>

          {/* ── SUCCÈS DÉVERROUILLÉS ── */}
          <Animated.View style={[S(2), { marginBottom: 14 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <Text style={{ fontSize: 11, color: GOLD, letterSpacing: 3, textTransform: 'uppercase', fontWeight: '700' }}>SUCCÈS DÉVERROUILLÉS</Text>
              <TouchableOpacity onPress={() => setShowVoyage(true)}>
                <Text style={{ fontSize: 10, color: C.dim }}>VOIR TOUT  ›</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingRight: 8 }}>
              {STREAK_MILESTONES.map((m: any, i: number) => {
                const unlocked = bestStreak >= m.days || streak >= m.days || unlockedMilestones.has(m.days);
                return (
                  <View key={i} style={{ width: 68, alignItems: 'center', gap: 6 }}>
                    <View style={{ opacity: unlocked ? 1 : 0.3 }}>
                      <MedalBadge milestoneIndex={i} achieved={unlocked} size={56} />
                    </View>
                    <Text style={{ fontSize: 8, color: unlocked ? C.text : C.dim, textAlign: 'center', fontWeight: '600' }} numberOfLines={1}>
                      {m.title}
                    </Text>
                    <Text style={{ fontSize: 7, color: unlocked ? GOLD : C.dim, textAlign: 'center' }}>
                      {m.days} jours
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
            <TouchableOpacity onPress={() => setShowAchievements(true)} style={{ marginTop: 10, alignSelf: 'flex-start' }}>
              <Text style={{ fontSize: 10, color: GOLD, fontWeight: '700' }}>Voir les succès d'habitudes ›</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* ── JOURNAL RAPIDE ── */}
          <Animated.View style={[S(3), { marginBottom: 14 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <Text style={{ fontSize: 11, color: GOLD, letterSpacing: 3, textTransform: 'uppercase', fontWeight: '700' }}>JOURNAL RAPIDE</Text>
              <TouchableOpacity onPress={() => router.push('/journal-history')}>
                <Text style={{ fontSize: 10, color: C.dim }}>VOIR TOUT  ›</Text>
              </TouchableOpacity>
            </View>
            <View style={{ backgroundColor: '#0A0800', borderRadius: 16, borderWidth: 1, borderColor: GOLD + '22', padding: 16, flexDirection: 'row', gap: 14, alignItems: 'flex-start' }}>
              <Image source={require('@/assets/ui/journal_rapide_thumb.png')} style={{ width: 56, height: 56, borderRadius: 10, borderWidth: 1, borderColor: GOLD + '33' }} resizeMode="cover" />
              <View style={{ flex: 1 }}>
                <TextInput
                  style={{ fontSize: 14, color: C.text, lineHeight: 22, fontStyle: 'italic', padding: 0, minHeight: 44 }}
                  value={journalText}
                  onChangeText={onJournalChange}
                  placeholder="Ce que j'ai accompli aujourd'hui..."
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  multiline
                />
                <Text style={{ fontSize: 10, color: C.dim, marginTop: 8, letterSpacing: 1 }}>
                  {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* ── STATISTIQUES GLOBALES ── */}
          <Animated.View style={[S(4), { marginBottom: 14 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <Text style={{ fontSize: 11, color: GOLD, letterSpacing: 3, textTransform: 'uppercase', fontWeight: '700' }}>STATISTIQUES GLOBALES</Text>
              <Text style={{ fontSize: 9, color: C.dim, letterSpacing: 1 }}>DEPUIS LE DÉBUT</Text>
            </View>
            <View style={{ backgroundColor: '#0A0800', borderRadius: 16, borderWidth: 1, borderColor: GOLD + '22', padding: 20, alignSelf: 'center', width: '88%' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                {[
                  { icon: require('@/assets/ui/icone_stat_seances.png'), value: history.filter(d => (d as any).workout_done).length, label: 'SÉANCES', sub: 'Complétées' },
                  { icon: require('@/assets/ui/icone_stat_streak.png'), value: bestStreak, label: 'JOURS',   sub: 'Streak max' },
                  { icon: require('@/assets/ui/icone_stat_succes.png'), value: STREAK_MILESTONES.filter((m: any) => bestStreak >= m.days || streak >= m.days || unlockedMilestones.has(m.days)).length, label: 'SUCCÈS', sub: 'Déverrouillés' },
                  { icon: require('@/assets/ui/icone_stat_regularite.png'), value: `${avgRegularity}%`, label: 'RÉGULARITÉ', sub: 'Moyenne' },
                ].map((stat, i) => (
                  <View key={i} style={{ alignItems: 'center', flex: 1, paddingTop: 44, position: 'relative' }}>
                    <Image source={stat.icon} style={{ position: 'absolute', top: -4, width: 48, height: 48 }} resizeMode="contain" />
                    <Text style={{ fontFamily: 'SpaceMono', fontSize: 18, color: C.text, fontWeight: '700' }}>{stat.value}</Text>
                    <Text style={{ fontSize: 8, color: GOLD, letterSpacing: 1, textTransform: 'uppercase', marginTop: 3, textAlign: 'center' }}>{stat.label}</Text>
                    <Text style={{ fontSize: 7, color: C.dim, textAlign: 'center', marginTop: 1 }}>{stat.sub}</Text>
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>

          {/* ── RÉGULARITÉ HABITUDES ── */}
          <Animated.View style={[S(5), { marginBottom: 14 }]}>
            <Text style={{ fontSize: 11, color: GOLD, letterSpacing: 3, textTransform: 'uppercase', fontWeight: '700', marginBottom: 12 }}>RÉGULARITÉ HABITUDES</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 14 }}>
              {([
                ['week', 'CETTE SEMAINE'], ['month', 'CE MOIS'], ['6months', '6 DERNIERS MOIS'], ['year', 'CETTE ANNÉE'], ['all', 'TOUT'],
              ] as [typeof statsRange, string][]).map(([key, label]) => (
                <TouchableOpacity
                  key={key}
                  onPress={() => setStatsRange(key)}
                  style={{
                    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
                    backgroundColor: statsRange === key ? GOLD + '22' : 'rgba(255,255,255,0.04)',
                    borderWidth: 1, borderColor: statsRange === key ? GOLD : 'rgba(255,255,255,0.1)',
                  }}
                >
                  <Text style={{ fontSize: 10, fontWeight: '700', color: statsRange === key ? GOLD : C.dim }}>{label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={{ backgroundColor: '#0A0800', borderRadius: 16, borderWidth: 1, borderColor: GOLD + '22', padding: 18, gap: 16 }}>
              {habitStats.map(h => {
                const col = h.pct >= 70 ? C.green : h.pct >= 40 ? GOLD : C.red;
                return (
                  <View key={h.key}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <Text style={{ fontSize: 13, color: h.pct >= 70 ? C.text : C.dim, flex: 1, fontWeight: h.pct >= 70 ? '600' : '400' }}>{h.label}</Text>
                      <Text style={{ fontFamily: 'SpaceMono', fontSize: 11, color: col }}>{h.pct}%</Text>
                    </View>
                    <View style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                      <View style={{ height: '100%', borderRadius: 2, width: `${h.pct}%` as any, backgroundColor: col }} />
                    </View>
                  </View>
                );
              })}
            </View>
          </Animated.View>

        </View>
      </ScrollView>

      {/* Modals */}
      {showEdit && <EditProfileModal profile={profile} onClose={() => setShowEdit(false)} onSave={updateProfile} />}

      <Modal visible={showRanks} animationType="slide" presentationStyle="fullScreen">
        <RanksScreen onClose={() => setShowRanks(false)} isInDanger={inactivity.isInDanger} initialRankLevel={rank.level} />
      </Modal>

      <VoyageModal visible={showVoyage} onClose={() => setShowVoyage(false)}
        milestones={STREAK_MILESTONES} streak={streak} bestStreak={bestStreak}
        unlockedSet={unlockedMilestones} gender={gender} />

      <AchievementsScreen visible={showAchievements} onClose={() => setShowAchievements(false)} userId={user?.id} />

      <SoundSettingsScreen visible={showSoundSettings} onClose={() => setShowSoundSettings(false)} />

      <Modal visible={showSettings} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: C.bg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: C.s3 }}>
            <TouchableOpacity onPress={() => setShowSettings(false)}><Text style={{ color: C.dim, fontSize: 14 }}>Fermer</Text></TouchableOpacity>
            <Text style={{ fontFamily: 'Cinzel', fontSize: 15, color: GOLDB, letterSpacing: 2 }}>PARAMÈTRES</Text>
            <View style={{ width: 60 }} />
          </View>
          <ScrollView contentContainerStyle={{ paddingVertical: 16 }}>
            {[
              {
                title: 'COMPTE',
                items: [
                  { icon: require('@/assets/ui/icone_param_profil.png'), label: profile?.name ?? 'Profil', sub: user?.email, onPress: () => { setShowSettings(false); setTimeout(() => setShowEdit(true), 300); } },
                  { icon: require('@/assets/ui/icone_param_genre.png'), label: 'Genre', onPress: () => { setShowSettings(false); setTimeout(() => Alert.alert('Bientôt disponible', 'Le changement de genre (Krios/Aspasia) sera disponible prochainement.'), 300); } },
                  { icon: require('@/assets/ui/icone_param_mdp.png'), label: 'Mot de passe', onPress: () => { setShowSettings(false); setTimeout(() => Alert.alert('Bientôt disponible', 'La modification du mot de passe sera disponible prochainement.'), 300); } },
                ],
              },
              {
                title: 'EXPÉRIENCE',
                items: [
                  { icon: require('@/assets/ui/icone_param_notif.png'), label: 'Notifications', onPress: () => { setShowSettings(false); setTimeout(() => setShowNotifSettings(true), 300); } },
                  { icon: require('@/assets/ui/icone_param_voix.png'), label: 'Ambiance sonore', sub: 'Musique de fond par page', type: 'toggle', value: ambientEnabled, onToggle: setAmbientEnabled },
                  { icon: require('@/assets/ui/icone_param_voix.png'), label: 'Volume des sons', sub: 'Régler chaque effet sonore', onPress: () => { setShowSettings(false); setTimeout(() => setShowSoundSettings(true), 300); } },
                  { icon: require('@/assets/ui/icone_param_voix.png'), label: 'Voix & narration', sub: 'Krios & Aspasia', onPress: () => { setShowSettings(false); setTimeout(() => Alert.alert('Bientôt disponible', 'Les réglages de voix seront disponibles prochainement.'), 300); } },
                  { icon: require('@/assets/ui/icone_param_onboarding.png'), label: "Revoir l'onboarding", dim: true, onPress: () => {
                    setShowSettings(false);
                    setTimeout(() => Alert.alert("Revoir l'onboarding", "Réinitialiser ?", [
                      { text: 'Annuler', style: 'cancel' },
                      { text: 'Réinitialiser', onPress: async () => { await supabase.from('profiles').update({ onboarding_done: false }).eq('id', user?.id); } },
                    ]), 300);
                  }},
                ],
              },
              {
                title: 'PROGRESSION',
                items: [
                  { icon: require('@/assets/ui/icone_param_rangs.png'), label: 'Mes rangs', onPress: () => { setShowSettings(false); setTimeout(() => setShowRanks(true), 300); } },
                ],
              },
              {
                title: 'SUPPORT',
                items: [
                  { icon: require('@/assets/ui/icone_param_aide.png'), label: 'Aide & contact', onPress: () => { setShowSettings(false); setTimeout(() => Alert.alert('Bientôt disponible', "La page d'aide sera disponible prochainement."), 300); } },
                  { icon: require('@/assets/ui/icone_param_note.png'), label: 'Noter AEGIS', onPress: () => { setShowSettings(false); setTimeout(() => Alert.alert('Bientôt disponible', "L'app n'est pas encore sur les stores."), 300); } },
                  { icon: require('@/assets/ui/icone_param_confidentialite.png'), label: 'Confidentialité & conditions', onPress: () => { setShowSettings(false); setTimeout(() => Alert.alert('Bientôt disponible', 'Ces pages seront disponibles prochainement.'), 300); } },
                ],
              },
              {
                title: 'ZONE SENSIBLE',
                items: [
                  { icon: require('@/assets/ui/icone_param_deconnexion.png'), label: 'Se déconnecter', red: true, onPress: () => { setShowSettings(false); setTimeout(() => Alert.alert('Déconnexion', '', [{ text: 'Annuler', style: 'cancel' }, { text: 'Déconnecter', style: 'destructive', onPress: signOut }]), 300); } },
                  { icon: require('@/assets/ui/icone_param_supprimer.png'), label: 'Supprimer mon compte', red: true, onPress: () => { setShowSettings(false); setTimeout(handleDeleteAccount, 300); } },
                ],
              },
            ].map((section, si) => (
              <View key={si} style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 10, color: GOLD, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '700', marginHorizontal: 16, marginBottom: 8 }}>
                  {section.title}
                </Text>
                <View style={{ backgroundColor: C.s1, borderWidth: 1, borderColor: C.s3, overflow: 'hidden', marginHorizontal: 16, borderRadius: 14 }}>
                  {section.items.map((item, i, arr) => {
                    const isToggle = (item as any).type === 'toggle';
                    const Wrapper = isToggle ? View : TouchableOpacity;
                    return (
                      <Wrapper key={i} style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: i < arr.length - 1 ? 1 : 0, borderBottomColor: C.s3 }} {...(!isToggle ? { onPress: item.onPress } : {})}>
                        <Image source={item.icon} style={{ width: 22, height: 22, marginRight: 14 }} resizeMode="contain" />
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14, color: (item as any).red ? C.red : (item as any).dim ? C.dim : C.text, fontWeight: '500' }}>{item.label}</Text>
                          {(item as any).sub && <Text style={{ fontSize: 11, color: C.dim, marginTop: 1 }}>{(item as any).sub}</Text>}
                        </View>
                        {isToggle ? (
                          <Switch
                            value={(item as any).value}
                            onValueChange={(item as any).onToggle}
                            trackColor={{ false: C.s3, true: GOLD + '66' }}
                            thumbColor={(item as any).value ? GOLD : '#888'}
                          />
                        ) : (
                          <Text style={{ color: C.dim, fontSize: 18 }}>›</Text>
                        )}
                      </Wrapper>
                    );
                  })}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={showNotifSettings} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: C.bg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: C.s3 }}>
            <TouchableOpacity onPress={() => setShowNotifSettings(false)}><Text style={{ color: C.dim, fontSize: 14 }}>Fermer</Text></TouchableOpacity>
            <Text style={{ fontFamily: 'Cinzel', fontSize: 15, color: GOLDB, letterSpacing: 2 }}>NOTIFICATIONS</Text>
            <View style={{ width: 60 }} />
          </View>
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <NotificationSettings />
          </ScrollView>
        </View>
      </Modal>

      {showMonthPicker && <MonthPickerModal current={{ month: selectedMonth, year: selectedYear }} history={history} createdAt={user?.created_at} onSelect={(m: number, y: number) => { setSelectedMonth(m); setSelectedYear(y); }} onClose={() => setShowMonthPicker(false)} />}

      <PauseModal
        visible={showPauseModal}
        onClose={() => setShowPauseModal(false)}
        onStart={startPause}
        onCancel={cancelPause}
        isPauseActive={isPauseActive}
        pauseUntil={pauseUntil}
      />

      <MentorScreen
        visible={showMentor}
        onClose={() => setShowMentor(false)}
        mentorId={mentorId}
        onSelectMentor={setMentorId}
        gender={gender}
        userId={user?.id}
      />
    </SafeAreaView>
  );
}

function PauseModal({ visible, onClose, onStart, onCancel, isPauseActive, pauseUntil }: {
  visible: boolean; onClose: () => void; onStart: (days: number) => void; onCancel: () => void;
  isPauseActive: boolean; pauseUntil: string | null;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: '#0A0800', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: '#C9A84C33', padding: 20, paddingBottom: 40 }}>
          <Text style={{ fontFamily: 'Cinzel', fontSize: 16, color: '#E8C46A', fontWeight: '700', marginBottom: 8 }}>
            {isPauseActive ? 'Pause en cours' : 'Annoncer une pause'}
          </Text>
          <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 18, marginBottom: 20 }}>
            {isPauseActive
              ? `Ta série est gelée jusqu'au ${pauseUntil}. Reviens quand tu veux, rien ne sera perdu.`
              : "Pars l'esprit tranquille. Le temps de ta pause ne comptera pas contre ta série — ce n'est pas un abandon, juste un chapitre qui attend."}
          </Text>

          {isPauseActive ? (
            <TouchableOpacity onPress={() => { onCancel(); onClose(); }} style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
              <Text style={{ color: '#8a8a8a', fontWeight: '700', fontSize: 13 }}>JE SUIS DE RETOUR</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {[3, 7, 14].map(days => (
                <TouchableOpacity
                  key={days}
                  onPress={() => { onStart(days); onClose(); }}
                  style={{ flex: 1, backgroundColor: '#C9A84C22', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#C9A84C55' }}
                >
                  <Text style={{ color: '#E8C46A', fontWeight: '700', fontSize: 16 }}>{days}j</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity onPress={onClose} style={{ marginTop: 14, alignItems: 'center' }}>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
