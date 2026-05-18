import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Dimensions, Modal, TextInput, Animated,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useDay } from '@/hooks/useDay';
import { C } from '@/constants/colors';
import { XPBar, RankBadge } from '@/components/XPBar';
import { AvatarDisplay, AvatarHero } from '@/components/AvatarCreator';
import AvatarCreator, { type AvatarConfig } from '@/components/AvatarCreator';
import MedalBadge from '@/components/MedalBadge';
import VoyageModal from '@/components/VoyageModal';
import RanksScreen from '@/components/RanksScreen';
import NotificationSettings from '@/components/NotifSettings';
import { calcTotalXP, getRank, RANKS, STREAK_MILESTONES } from '@/constants/rpg';
import { calcScore, HABIT_KEYS, HABIT_LABELS } from '@/constants/types';

const { width } = Dimensions.get('window');

// ─── Palette or AEGIS ────────────────────────────────────────────────────────
const GOLD  = '#C9A84C';
const GOLDB = '#E8C46A';
const GOLDD = '#C9A84C33';
// ─────────────────────────────────────────────────────────────────────────────

const RANK_PHRASES: Record<string, string> = {
  'INITIÉ':     'Les fondations sont posées.',
  'DISCIPLE':   'La discipline prend racine.',
  'GUERRIER':   'Le corps et l\'esprit s\'alignent.',
  'STRATÈGE':   'Chaque jour, un plan. Chaque plan, exécuté.',
  'CONQUÉRANT': 'Rien ne résiste à ta constance.',
  'CHAMPION':   'Tu inspires sans le savoir.',
  'MAÎTRE':     'La maîtrise est ton standard.',
  'ÉLITE':      'Tu appartiens au sommet.',
  'AEGIS':      'Tu es devenu la légende.',
};

const HABIT_ICONS: Record<string, string> = {
  workout_done:  '⚔️',
  calories_ok:   '🍎',
  learning_done: '📚',
  m_face:        '✨',
  outfit_ok:     '👔',
  morning_water: '💧',
};

// ─── EditProfileModal ─────────────────────────────────────────────────────────
function EditProfileModal({ profile, onClose, onSave }: { profile: any; onClose: () => void; onSave: (d: any) => void }) {
  const [name, setName] = useState(profile?.name ?? '');
  const [cal, setCal]   = useState(String(profile?.cal_target ?? 2300));
  const [prot, setProt] = useState(String(profile?.prot_target ?? 180));

  function handleSave() {
    if (!name.trim()) return Alert.alert('Entre ton prénom');
    const calNum = parseInt(cal), protNum = parseInt(prot);
    if (isNaN(calNum) || calNum < 1000 || calNum > 5000) return Alert.alert('Calories invalides');
    if (isNaN(protNum) || protNum < 50  || protNum > 400) return Alert.alert('Protéines invalides');
    onSave({ name: name.trim(), cal_target: calNum, prot_target: protNum });
    onClose();
  }

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: C.s3 }}>
          <TouchableOpacity onPress={onClose}><Text style={{ color: C.dim, fontSize: 14 }}>Annuler</Text></TouchableOpacity>
          <Text style={{ fontFamily: 'Cinzel', fontSize: 16, color: GOLDB, letterSpacing: 2 }}>MON COMPTE</Text>
          <TouchableOpacity onPress={handleSave}><Text style={{ color: GOLD, fontSize: 14, fontWeight: '700' }}>Sauvegarder</Text></TouchableOpacity>
        </View>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={{ padding: 24 }}>

            {/* Avatar dans les paramètres */}
            <Text style={edit.sectionTitle}>Identité</Text>
            <Text style={edit.label}>Prénom</Text>
            <TextInput style={edit.input} value={name} onChangeText={setName} placeholder="Ton prénom" placeholderTextColor={C.dim} autoCorrect={false} />

            <Text style={edit.sectionTitle}>Objectifs nutritionnels</Text>
            <Text style={edit.label}>Calories par jour</Text>
            <View style={edit.inputRow}>
              <TextInput style={[edit.input, { flex: 1, marginBottom: 0 }]} value={cal} onChangeText={setCal} keyboardType="numeric" placeholder="2300" placeholderTextColor={C.dim} />
              <Text style={edit.unit}>kcal</Text>
            </View>
            <Text style={[edit.label, { marginTop: 14 }]}>Protéines par jour</Text>
            <View style={edit.inputRow}>
              <TextInput style={[edit.input, { flex: 1, marginBottom: 0 }]} value={prot} onChangeText={setProt} keyboardType="numeric" placeholder="180" placeholderTextColor={C.dim} />
              <Text style={edit.unit}>g</Text>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ─── MonthPickerModal ─────────────────────────────────────────────────────────
function MonthPickerModal({ current, history, onSelect, onClose }: { current: { month: number; year: number }; history: any[]; onSelect: (m: number, y: number) => void; onClose: () => void }) {
  const oldestDate = history.length > 0
    ? new Date(Math.min(...history.map(d => new Date(d.date).getTime())))
    : new Date();
  const months: { month: number; year: number }[] = [];
  const cursor = new Date(oldestDate.getFullYear(), oldestDate.getMonth(), 1);
  const now = new Date();
  while (cursor <= now) {
    months.push({ month: cursor.getMonth(), year: cursor.getFullYear() });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  months.reverse();

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
            const days  = history.filter(d => { const dt = new Date(d.date); return dt.getMonth() === month && dt.getFullYear() === year; });
            const avg   = days.length > 0 ? Math.round(days.reduce((a, d) => a + calcScore(d), 0) / days.length) : 0;
            return (
              <TouchableOpacity
                key={`${year}-${month}`}
                style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isSelected ? GOLDD : C.s1, borderWidth: 1, borderColor: isSelected ? GOLD : C.s3, borderRadius: 12, padding: 16, marginBottom: 10 }}
                onPress={() => { onSelect(month, year); onClose(); }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'Cinzel', fontSize: 14, color: isSelected ? GOLDB : C.text, textTransform: 'capitalize' }}>{label}</Text>
                  <Text style={{ fontSize: 11, color: C.dim, marginTop: 3 }}>{days.length} jours enregistrés</Text>
                </View>
                <Text style={{ fontFamily: 'SpaceMono', fontSize: 16, color: avg >= 70 ? C.green : avg >= 40 ? GOLD : C.dim }}>
                  {days.length > 0 ? `${avg}%` : '—'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── ProfileScreen ────────────────────────────────────────────────────────────

// ─── RanksAccordion — tap pour voir tous les rangs ────────────────────────────
function RanksAccordion({ rank, totalXP }: { rank: any; totalXP: number }) {
  const [open, setOpen] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  function toggle() {
    setOpen(o => !o);
    Animated.spring(anim, { toValue: open ? 0 : 1, tension: 80, friction: 12, useNativeDriver: false }).start();
  }

  const maxH = anim.interpolate({ inputRange: [0, 1], outputRange: [0, RANKS.length * 64] });

  return (
    <View style={{ backgroundColor: C.s1, borderWidth: 1, borderColor: C.s3, borderRadius: 16, overflow: 'hidden', marginBottom: 14 }}>
      <TouchableOpacity onPress={toggle} style={{ flexDirection: 'row', alignItems: 'center', padding: 18, gap: 14 }}>
        <View style={{
          width: 44, height: 44, borderRadius: 22,
          backgroundColor: rank.color + '22', borderWidth: 2, borderColor: rank.color,
          alignItems: 'center', justifyContent: 'center',
          shadowColor: rank.color, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 8,
        }}>
          <Text style={{ fontFamily: 'Cinzel', fontSize: 9, color: rank.color, fontWeight: '700', textAlign: 'center' }}>{rank.name}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'Cinzel', fontSize: 15, color: rank.color, letterSpacing: 1 }}>{rank.name}</Text>
          <Text style={{ fontSize: 11, color: C.dim, marginTop: 2, fontStyle: 'italic' }}>
            {RANK_PHRASES[rank.name] ?? 'Continue.'}
          </Text>
        </View>
        <Animated.Text style={{
          color: GOLD, fontSize: 16,
          transform: [{ rotate: anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) }],
        }}>
          {'>'}
        </Animated.Text>
      </TouchableOpacity>

      <Animated.View style={{ maxHeight: maxH, overflow: 'hidden' }}>
        <View style={{ borderTopWidth: 1, borderTopColor: C.s3 }}>
          {RANKS.map((r, i) => {
            const achieved  = totalXP >= r.minXP;
            const isCurrent = rank.level === r.level;
            return (
              <View key={r.level} style={{
                flexDirection: 'row', alignItems: 'center', gap: 14,
                paddingHorizontal: 18, paddingVertical: 12,
                backgroundColor: isCurrent ? r.color + '0C' : 'transparent',
                borderBottomWidth: i < RANKS.length - 1 ? 1 : 0, borderBottomColor: C.s3,
              }}>
                <View style={{
                  width: 28, height: 28, borderRadius: 14,
                  backgroundColor: achieved ? r.color + '22' : C.s2,
                  borderWidth: 1.5, borderColor: achieved ? r.color : C.s3,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  {achieved
                    ? <Text style={{ color: r.color, fontSize: 12, fontWeight: '800' }}>{'v'}</Text>
                    : <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.s3 }} />
                  }
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'Cinzel', fontSize: 12, letterSpacing: 1, color: achieved ? r.color : C.dim }}>
                    {r.name}{isCurrent ? '  <' : ''}
                  </Text>
                  <Text style={{ fontSize: 10, color: C.dim, marginTop: 1 }}>{r.minXP} XP</Text>
                </View>
                {isCurrent && (
                  <View style={{ backgroundColor: r.color + '22', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: r.color + '55' }}>
                    <Text style={{ fontSize: 8, color: r.color, fontWeight: '700', letterSpacing: 1 }}>ACTUEL</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </Animated.View>
    </View>
  );
}

export default function ProfileScreen() {
  const { user, profile, updateProfile, signOut } = useAuth();
  const { day, history, streak, loadHistory, loadToday } = useDay(user?.id);

  const scrollRef  = useRef<any>(null);
  const ranksRef   = useRef<any>(null);
  const medalsRef  = useRef<any>(null);
  const heatmapRef = useRef<any>(null);
  const regulRef   = useRef<any>(null);

  const [showEdit,          setShowEdit]          = useState(false);
  const [showMonthPicker,   setShowMonthPicker]   = useState(false);
  const [showAvatarCreator, setShowAvatarCreator] = useState(false);
  const [showSettings,      setShowSettings]      = useState(false);
  const [showVoyage,        setShowVoyage]        = useState(false);
  const [showRanks,         setShowRanks]         = useState(false);
  const [showNotifSettings, setShowNotifSettings] = useState(false);
  const [avatarConfig,      setAvatarConfig]      = useState<AvatarConfig>({ body: 'athletic', skin: 3 });
  const [selectedMonth,     setSelectedMonth]     = useState(new Date().getMonth());
  const [selectedYear,      setSelectedYear]      = useState(new Date().getFullYear());
  const [unlockedMilestones,setUnlockedMilestones]= useState<Set<number>>(new Set());

  useFocusEffect(useCallback(() => {
    if (user?.id) { loadHistory(); loadToday(); }
  }, [user?.id]));

  useEffect(() => {
    async function load() {
      const unlocked = new Set<number>();
      for (const m of STREAK_MILESTONES) {
        const shown = await AsyncStorage.getItem(`@aegis:milestone_shown_${m.days}`);
        if (shown) unlocked.add(m.days);
      }
      setUnlockedMilestones(unlocked);
    }
    load();
  }, []);

  if (!user) return null;

  // ── Calculs ────────────────────────────────────────────────────────────────
  const totalXP    = calcTotalXP([...history.filter(h => h.date !== day.date), day]);
  const rank       = getRank(totalXP);
  const totalDays  = history.length;
  const perfectDays = [...history.filter(h => h.date !== day.date), day].filter(d => calcScore(d) === 100).length;
  const bestStreak = (() => {
    let best = 0, cur = 0;
    for (const d of [...history].sort((a, b) => a.date.localeCompare(b.date))) {
      if (calcScore(d) >= 40) { cur++; best = Math.max(best, cur); } else cur = 0;
    }
    return best;
  })();
  const habitStats = HABIT_KEYS.map(k => ({
    key: k as string,
    label: HABIT_LABELS[k as string],
    icon: HABIT_ICONS[k as string] ?? '✦',
    pct: totalDays > 0 ? Math.round((history.filter(d => !!(d as any)[k]).length / totalDays) * 100) : 0,
  })).sort((a, b) => b.pct - a.pct);

  const nextMilestone = STREAK_MILESTONES.find(m => streak < m.days);

  // 7 derniers jours pour les dots (style Liftoff)
  // 7 jours lun→aujourd'hui
  const today7 = (() => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=dim, 1=lun...
    const daysFromMonday = (dayOfWeek + 6) % 7; // 0=lundi
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - daysFromMonday + i);
      const ds = d.toISOString().split('T')[0];
      const isToday7 = ds === now.toISOString().split('T')[0];
      const log = isToday7 ? day : history.find(h => h.date === ds);
      const isFuture = d > now;
      const done7 = !isFuture && log ? calcScore(log) >= 40 : false;
      return { ds, dayName: ['L','M','M','J','V','S','D'][i], done: done7, isFuture };
    });
  })();

  // Heatmap
  const isCurrentMonth = selectedMonth === new Date().getMonth() && selectedYear === new Date().getFullYear();
  const monthLabel     = new Date(selectedYear, selectedMonth, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const today          = new Date().toISOString().split('T')[0];
  const cellSize       = Math.floor((width - 32 - 4 * 6) / 7);

  const monthDays = (() => {
    const lastDay = isCurrentMonth ? new Date().getDate() : new Date(selectedYear, selectedMonth + 1, 0).getDate();
    return Array.from({ length: lastDay }, (_, i) => {
      const dayNum = i + 1;
      const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      const log   = dateStr === today ? day : history.find(h => h.date === dateStr);
      const score = log ? calcScore(log) : 0;
      return { day: dayNum, dateStr, score, isPerfect: score === 100, isToday: dateStr === today };
    });
  })();

  const firstDate     = history.length > 0 ? new Date(Math.min(...history.map(d => new Date(d.date).getTime()))) : new Date();
  const isFirstMonth  = selectedMonth === firstDate.getMonth() && selectedYear === firstDate.getFullYear();

  function goToPrevMonth() {
    if (isFirstMonth) return;
    if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(y => y - 1); } else setSelectedMonth(m => m - 1);
  }
  function goToNextMonth() {
    if (isCurrentMonth) return;
    if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(y => y + 1); } else setSelectedMonth(m => m + 1);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>

        {/* ── Hero Liftoff-style — overlay complet ── */}
        <View style={{ marginHorizontal: -16, position: 'relative' }}>
          {/* Personnage — tap = AvatarCreator */}
          <TouchableOpacity onPress={() => setShowAvatarCreator(true)} activeOpacity={0.9}>
            <AvatarHero config={avatarConfig} rankColor={rank.color} />
          </TouchableOpacity>

          {/* Overlay nom + rang — en haut */}
          <View style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            flexDirection: 'row', alignItems: 'flex-start',
            justifyContent: 'space-between',
            paddingHorizontal: 20, paddingTop: 16,
          }}>
            <View>
              <Text style={{ fontFamily: 'Cinzel', fontSize: 22, color: C.text, letterSpacing: 1,
                textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 8 }}>
                {profile?.name ?? 'Guerrier'}
              </Text>
              <Text style={{ fontSize: 11, color: rank.color, marginTop: 3, letterSpacing: 1 }}>Niveau {rank.level}</Text>
            </View>
            <View style={{
              width: 60, height: 60, borderRadius: 30,
              backgroundColor: rank.color + '22', borderWidth: 2, borderColor: rank.color,
              alignItems: 'center', justifyContent: 'center',
              shadowColor: rank.color, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 12,
            }}>
              <Text style={{ fontFamily: 'Cinzel', fontSize: 8, color: rank.color, fontWeight: '700', textAlign: 'center', paddingHorizontal: 3 }}>
                {rank.name}
              </Text>
            </View>
          </View>

          {/* Overlay XP bar — en bas sur le personnage */}
          <View style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            paddingHorizontal: 20, paddingBottom: 14,
            backgroundColor: 'rgba(8,6,10,0.45)',
          }}>
            <XPBar totalXP={totalXP} />
          </View>
        </View>

        {/* ── Feature grid style Liftoff ── */}
        <View style={{ backgroundColor: C.s1, borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.s3, paddingVertical: 16, marginBottom: 20, marginHorizontal: -16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            {([
              { icon: '🏆', label: 'Rangs',    onPress: () => setShowRanks(true) },
              { icon: '🎖️', label: 'Médailles', onPress: () => setShowVoyage(true) },
              { icon: '📅', label: 'Activité', onPress: () => heatmapRef.current?.measureLayout(scrollRef.current, (_x: number, y: number) => scrollRef.current?.scrollTo({ y: y - 20, animated: true }), () => {}) },
              { icon: '⚡', label: 'Régularité', onPress: () => regulRef.current?.measureLayout(scrollRef.current, (_x: number, y: number) => scrollRef.current?.scrollTo({ y: y - 20, animated: true }), () => {}) },
              { icon: '🔔', label: 'Notifs',   onPress: () => setShowNotifSettings(true) },
              { icon: '⚙️', label: 'Paramètres', onPress: () => setShowSettings(true) },
            ] as const).map((f, i) => (
              <TouchableOpacity key={i} onPress={f.onPress} style={{ alignItems: 'center', gap: 6, width: (width - 16) / 6 }}>
                <View style={{ width: 50, height: 50, borderRadius: 14, backgroundColor: C.s2, borderWidth: 1, borderColor: C.s3, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 22 }}>{f.icon}</Text>
                </View>
                <Text style={{ fontSize: 9, color: C.dim, textAlign: 'center', lineHeight: 12 }}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ paddingHorizontal: 16 }}>

        {/* ── Streak — 7 dots Liftoff ── */}
        <View style={{ backgroundColor: streak >= 3 ? '#120A00' : C.s1, borderWidth: 1, borderColor: streak >= 3 ? GOLD + '44' : C.s3, borderRadius: 16, padding: 18, marginBottom: 14 }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 18 }}>🔥</Text>
              <Text style={{ fontFamily: 'Cinzel', fontSize: 14, color: C.text, letterSpacing: 1 }}>Streaks</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
              <Text style={{ fontFamily: 'SpaceMono', fontSize: 28, color: streak > 0 ? GOLDB : C.dim }}>{streak}</Text>
              <Text style={{ fontSize: 12, color: C.dim }}>j</Text>
            </View>
          </View>

          {/* 7 dots */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
            {today7.map((d, i) => (
              <View key={i} style={{ alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 9, color: C.dim }}>{d.dayName}</Text>
                <View style={{
                  width: 38, height: 38, borderRadius: 19,
                  backgroundColor: d.done ? GOLD + '33' : C.s2,
                  borderWidth: 2, borderColor: d.done ? GOLD : C.s3,
                  alignItems: 'center', justifyContent: 'center',
                  opacity: d.isFuture ? 0.3 : 1,
                }}>
                  {d.done && <Text style={{ fontSize: 14 }}>🔥</Text>}
                </View>
              </View>
            ))}
          </View>

          {/* Record + progression + parfaits */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTopWidth: 1, borderTopColor: C.s3 }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontFamily: 'SpaceMono', fontSize: 22, color: GOLD }}>{bestStreak}</Text>
              <Text style={{ fontSize: 9, color: C.dim, marginTop: 3, letterSpacing: 1 }}>RECORD</Text>
            </View>
            {nextMilestone ? (
              <View style={{ flex: 1, paddingHorizontal: 16, justifyContent: 'center' }}>
                <View style={{ height: 3, backgroundColor: C.s3, borderRadius: 2, overflow: 'hidden', marginBottom: 5 }}>
                  <View style={{ height: 3, backgroundColor: GOLD, borderRadius: 2, width: `${Math.min(Math.round((streak / nextMilestone.days) * 100), 100)}%` as any }} />
                </View>
                <Text style={{ fontSize: 9, color: C.dim }}>{nextMilestone.days - streak}j → {nextMilestone.title}</Text>
              </View>
            ) : <View style={{ flex: 1 }} />}
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontFamily: 'SpaceMono', fontSize: 22, color: perfectDays > 0 ? GOLDB : C.dim }}>{perfectDays}</Text>
              <Text style={{ fontSize: 9, color: C.dim, marginTop: 3, letterSpacing: 1 }}>PARFAITS ✦</Text>
            </View>
          </View>
        </View>

        {/* ── Heatmap mensuelle ── */}
        <View ref={heatmapRef}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, marginTop: 10 }}>
          <TouchableOpacity onPress={goToPrevMonth} style={{ padding: 8, opacity: isFirstMonth ? 0.3 : 1 }}>
            <Text style={{ color: GOLD, fontSize: 22 }}>‹</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowMonthPicker(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 10, color: GOLD, letterSpacing: 3, textTransform: 'uppercase' }}>{monthLabel}</Text>
            <Text style={{ color: GOLD, fontSize: 12 }}>▾</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={goToNextMonth} style={{ padding: 8, opacity: isCurrentMonth ? 0.3 : 1 }}>
            <Text style={{ color: GOLD, fontSize: 22 }}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
          {monthDays.map((d) => {
            const op = d.score >= 80 ? 1 : d.score >= 50 ? 0.6 : d.score >= 20 ? 0.3 : 0;
            return (
              <View key={d.day} style={[
                { width: cellSize, height: cellSize + 10, borderRadius: 6, alignItems: 'center', justifyContent: 'center', borderWidth: d.isToday ? 1.5 : 1 },
                d.isPerfect ? {
                  backgroundColor: GOLDB, borderColor: GOLDB,
                  shadowColor: GOLD, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 8, elevation: 6,
                } : {
                  backgroundColor: op > 0 ? `rgba(201,168,76,${op})` : C.s2,
                  borderColor: d.isToday ? '#FFFFFF' : C.s3,
                },
              ]}>
                <Text style={{ fontSize: 10, fontWeight: d.isPerfect ? '800' : '600', color: d.isPerfect ? '#000' : op > 0 ? '#000' : d.isToday ? C.text : C.dim }}>
                  {d.day}
                </Text>
                {d.isPerfect && <Text style={{ fontSize: 6, color: '#000', lineHeight: 8 }}>✦</Text>}
              </View>
            );
          })}
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Text style={{ fontSize: 10, color: C.dim }}>Moins actif</Text>
          <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
            {[0, 0.3, 0.6, 1].map((op, i) => (
              <View key={i} style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: op > 0 ? `rgba(201,168,76,${op})` : C.s2 }} />
            ))}
            <View style={{ width: 1, height: 14, backgroundColor: C.s3, marginHorizontal: 4 }} />
            <View style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: GOLDB, shadowColor: GOLD, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 4 }}>
              <Text style={{ fontSize: 6, color: '#000', textAlign: 'center', lineHeight: 14 }}>✦</Text>
            </View>
            <Text style={{ fontSize: 9, color: C.dim }}>Parfait</Text>
          </View>
          <Text style={{ fontSize: 10, color: C.dim }}>Plus actif</Text>
        </View>

        {/* Voyage AEGIS — accessible via bouton Médailles */}
        </View>
        <View ref={regulRef}>
        {/* ── Régularité habitudes ── */}
        <Text style={styles.sectionTitle}>Régularité</Text>
        <View style={{ backgroundColor: C.s1, borderWidth: 1, borderColor: C.s3, borderRadius: 16, padding: 18, gap: 16, marginBottom: 24 }}>
          {habitStats.map(h => {
            const col = h.pct >= 70 ? C.green : h.pct >= 40 ? GOLD : C.red;
            return (
              <View key={h.key}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <Text style={{ fontSize: 16 }}>{h.icon}</Text>
                  <Text style={{ fontSize: 13, color: h.pct >= 70 ? C.text : C.dim, flex: 1, fontWeight: h.pct >= 70 ? '600' : '400' }}>{h.label}</Text>
                  <Text style={{ fontFamily: 'SpaceMono', fontSize: 11, color: col }}>{h.pct}%</Text>
                </View>
                <View style={{ height: 5, backgroundColor: C.s3, borderRadius: 3, overflow: 'hidden' }}>
                  <View style={{ height: '100%', borderRadius: 3, width: `${h.pct}%` as any, backgroundColor: col }} />
                </View>
              </View>
            );
          })}
        </View>

        </View>
        {/* ── Rangs accordéon ── */}
        <View ref={ranksRef}>
        <Text style={styles.sectionTitle}>Rangs</Text>
        <RanksAccordion rank={rank} totalXP={totalXP} />
        </View>

        </View>
      </ScrollView>

      {showEdit && <EditProfileModal profile={profile} onClose={() => setShowEdit(false)} onSave={updateProfile} />}

      <Modal visible={showRanks} animationType="slide" presentationStyle="fullScreen">
        <RanksScreen onClose={() => setShowRanks(false)} />
      </Modal>

      <VoyageModal
        visible={showVoyage}
        onClose={() => setShowVoyage(false)}
        milestones={STREAK_MILESTONES}
        streak={streak}
        bestStreak={bestStreak}
        unlockedSet={unlockedMilestones}
      />

      {/* Modal Paramètres */}
      <Modal visible={showSettings} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: C.bg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: C.s3 }}>
            <TouchableOpacity onPress={() => setShowSettings(false)}><Text style={{ color: C.dim, fontSize: 14 }}>Fermer</Text></TouchableOpacity>
            <Text style={{ fontFamily: 'Cinzel', fontSize: 15, color: GOLDB, letterSpacing: 2 }}>PARAMÈTRES</Text>
            <View style={{ width: 60 }} />
          </View>
          <ScrollView contentContainerStyle={{ padding: 0 }}>
            <View style={{ backgroundColor: C.s1, borderBottomWidth: 1, borderTopWidth: 1, borderColor: C.s3, overflow: 'hidden', marginBottom: 24 }}>
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: C.s3 }} onPress={() => { setShowSettings(false); setTimeout(() => setShowEdit(true), 300); }}>
                <Text style={{ fontSize: 18, marginRight: 14 }}>👤</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, color: C.text, fontWeight: '600' }}>{profile?.name ?? 'Guerrier'}</Text>
                  <Text style={{ fontSize: 11, color: C.dim, marginTop: 1 }}>{user?.email}</Text>
                </View>
                <Text style={{ color: C.dim, fontSize: 18 }}>›</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: C.s3 }} onPress={() => { setShowSettings(false); setTimeout(() => setShowAvatarCreator(true), 300); }}>
                <Text style={{ fontSize: 18, marginRight: 14 }}>🧬</Text>
                <Text style={{ fontSize: 14, color: C.text, flex: 1 }}>Personnaliser l'avatar</Text>
                <Text style={{ color: C.dim, fontSize: 18 }}>›</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: C.s3 }} onPress={() => { setShowSettings(false); setTimeout(() => setShowNotifSettings(true), 300); }}>
                <Text style={{ fontSize: 18, marginRight: 14 }}>🔔</Text>
                <Text style={{ fontSize: 14, color: C.text, flex: 1 }}>Notifications</Text>
                <Text style={{ color: C.dim, fontSize: 18 }}>›</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', padding: 18, borderTopWidth: 1, borderTopColor: C.s3 }}
                onPress={() => {
                  setShowSettings(false);
                  setTimeout(() => Alert.alert(
                    "Revoir l'onboarding",
                    "Réinitialiser l'onboarding pour le revoir ?",
                    [
                      { text: 'Annuler', style: 'cancel' },
                      { text: 'Réinitialiser', onPress: async () => {
                        const { supabase } = await import('@/lib/supabase');
                        await supabase.from('profiles').update({ onboarding_done: false }).eq('id', user?.id);
                        Alert.alert('Done', "Relance l'app pour voir l'onboarding.");
                      }},
                    ]
                  ), 300);
                }}
              >
                <Text style={{ fontSize: 18, marginRight: 14 }}>🔄</Text>
                <Text style={{ fontSize: 14, color: C.dim, flex: 1 }}>Revoir l'onboarding</Text>
                <Text style={{ color: C.dim, fontSize: 18 }}>›</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', padding: 18 }}
                onPress={() => { setShowSettings(false); setTimeout(() => Alert.alert('Déconnexion', 'Quitter AEGIS ?', [{ text: 'Annuler', style: 'cancel' }, { text: 'Déconnecter', style: 'destructive', onPress: signOut }]), 300); }}
              >
                <Text style={{ fontSize: 18, marginRight: 14 }}>🚪</Text>
                <Text style={{ fontSize: 14, color: C.red, flex: 1 }}>Se déconnecter</Text>
                <Text style={{ color: C.dim, fontSize: 18 }}>›</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Modal Notifications */}
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
      {showMonthPicker && <MonthPickerModal current={{ month: selectedMonth, year: selectedYear }} history={history} onSelect={(m, y) => { setSelectedMonth(m); setSelectedYear(y); }} onClose={() => setShowMonthPicker(false)} />}
      <AvatarCreator visible={showAvatarCreator} initial={avatarConfig} onSave={setAvatarConfig} onClose={() => setShowAvatarCreator(false)} />

    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  sectionTitle:  { fontSize: 10, color: GOLD, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12, marginTop: 4 },
  milestoneRow:  { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.s1, borderWidth: 1, borderColor: C.s3, borderRadius: 14, padding: 14 },
});

const edit = StyleSheet.create({
  label:        { fontSize: 10, color: C.dim, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 },
  sectionTitle: { fontFamily: 'Cinzel', fontSize: 14, color: GOLD, letterSpacing: 2, marginTop: 24, marginBottom: 16 },
  input:        { backgroundColor: C.s2, borderWidth: 1, borderColor: C.s3, borderRadius: 10, padding: 14, color: C.text, fontSize: 15, marginBottom: 16 },
  inputRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  unit:         { color: C.dim, fontSize: 13, width: 36 },
});
