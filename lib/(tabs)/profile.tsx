import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Dimensions, Modal, TextInput, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useDay } from '@/hooks/useDay';
import { C } from '@/constants/colors';
import { XPBar, RankBadge } from '@/components/XPBar';
import { calcTotalXP, getRank, RANKS, STREAK_MILESTONES } from '@/constants/rpg';
import { calcScore, HABIT_KEYS, HABIT_LABELS } from '@/constants/types';
import NotificationSettings from '@/components/NotifSettings';


const { width } = Dimensions.get('window');

function EditProfileModal({ profile, onClose, onSave }: { profile: any; onClose: () => void; onSave: (d: any) => void }) {
  const [name, setName] = useState(profile?.name ?? '');
  const [cal, setCal] = useState(String(profile?.cal_target ?? 2300));
  const [prot, setProt] = useState(String(profile?.prot_target ?? 180));

  function handleSave() {
    if (!name.trim()) return Alert.alert('Entre ton prénom');
    const calNum = parseInt(cal), protNum = parseInt(prot);
    if (isNaN(calNum) || calNum < 1000 || calNum > 5000) return Alert.alert('Calories invalides (1000–5000)');
    if (isNaN(protNum) || protNum < 50 || protNum > 400) return Alert.alert('Protéines invalides (50–400)');
    onSave({ name: name.trim(), cal_target: calNum, prot_target: protNum });
    onClose();
  }

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: C.s3 }}>
          <TouchableOpacity onPress={onClose}><Text style={{ color: C.dim, fontSize: 14 }}>Annuler</Text></TouchableOpacity>
          <Text style={{ fontFamily: 'Cinzel', fontSize: 16, color: C.goldBright, letterSpacing: 2 }}>MODIFIER</Text>
          <TouchableOpacity onPress={handleSave}><Text style={{ color: C.gold, fontSize: 14, fontWeight: '700' }}>Sauvegarder</Text></TouchableOpacity>
        </View>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={{ padding: 24 }}>
            <Text style={edit.label}>👤 Prénom</Text>
            <TextInput style={edit.input} value={name} onChangeText={setName} placeholder="Ton prénom" placeholderTextColor={C.dim} autoCorrect={false} />
            <Text style={edit.sectionTitle}>🎯 Objectifs nutritionnels</Text>
            <Text style={edit.label}>Calories par jour</Text>
            <View style={edit.inputRow}>
              <TextInput style={[edit.input, { flex: 1 }]} value={cal} onChangeText={setCal} keyboardType="numeric" placeholder="2300" placeholderTextColor={C.dim} />
              <Text style={edit.unit}>kcal</Text>
            </View>
            <Text style={edit.label}>Protéines par jour</Text>
            <View style={edit.inputRow}>
              <TextInput style={[edit.input, { flex: 1 }]} value={prot} onChangeText={setProt} keyboardType="numeric" placeholder="180" placeholderTextColor={C.dim} />
              <Text style={edit.unit}>g</Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function MonthPickerModal({ current, history, onSelect, onClose }: { current: { month: number; year: number }; history: any[]; onSelect: (m: number, y: number) => void; onClose: () => void }) {
  const oldestDate = history.length > 0
    ? new Date(Math.min(...history.map(d => new Date(d.date).getTime())))
    : new Date();
  const months = [];
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
          <Text style={{ fontFamily: 'Cinzel', fontSize: 16, color: C.goldBright, letterSpacing: 2 }}>CHOISIR UN MOIS</Text>
          <View style={{ width: 60 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {months.map(({ month, year }) => {
            const isSelected = month === current.month && year === current.year;
            const label = new Date(year, month, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
            const daysInMonth = history.filter(d => {
              const date = new Date(d.date);
              return date.getMonth() === month && date.getFullYear() === year;
            });
            const avg = daysInMonth.length > 0
              ? Math.round(daysInMonth.reduce((a, d) => a + calcScore(d), 0) / daysInMonth.length)
              : 0;
            return (
              <TouchableOpacity
                key={`${year}-${month}`}
                style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isSelected ? C.goldDim : C.s1, borderWidth: 1, borderColor: isSelected ? C.gold : C.s3, borderRadius: 12, padding: 16, marginBottom: 10 }}
                onPress={() => { onSelect(month, year); onClose(); }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'Cinzel', fontSize: 14, color: isSelected ? C.goldBright : C.text, textTransform: 'capitalize' }}>{label}</Text>
                  <Text style={{ fontSize: 11, color: C.dim, marginTop: 3 }}>{daysInMonth.length} jours enregistrés</Text>
                </View>
                <Text style={{ fontFamily: 'SpaceMono', fontSize: 16, color: avg >= 70 ? C.green : avg >= 40 ? C.gold : C.dim }}>
                  {daysInMonth.length > 0 ? `${avg}%` : '—'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function ProfileScreen() {
  const { user, profile, updateProfile, signOut } = useAuth();
  const { day, history, streak } = useDay(user?.id);
  const [showEdit, setShowEdit] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const totalXP = calcTotalXP([...history.filter(h => h.date !== day.date), day]);
  const rank = getRank(totalXP);
  const totalDays = history.length;
  const avgScore = totalDays > 0 ? Math.round(history.reduce((acc, d) => acc + calcScore(d), 0) / totalDays) : 0;
  const bestStreak = (() => {
    let best = 0, cur = 0;
    for (const d of [...history].sort((a, b) => a.date.localeCompare(b.date))) {
      if (calcScore(d) >= 40) { cur++; best = Math.max(best, cur); } else cur = 0;
    }
    return best;
  })();
  const totalWorkouts = history.filter(d => d.workout_done).length;
  const perfectDays = history.filter(d => calcScore(d) === 100).length;
  const habitStats = HABIT_KEYS.map(k => ({
    key: k as string, label: HABIT_LABELS[k as string],
    pct: totalDays > 0 ? Math.round((history.filter(d => !!(d as any)[k]).length / totalDays) * 100) : 0,
  })).sort((a, b) => b.pct - a.pct);

  const isCurrentMonth = selectedMonth === new Date().getMonth() && selectedYear === new Date().getFullYear();
  const monthLabel = new Date(selectedYear, selectedMonth, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  const monthDays = (() => {
    const today = new Date();
    const lastDay = isCurrentMonth ? today.getDate() : new Date(selectedYear, selectedMonth + 1, 0).getDate();
    return Array.from({ length: lastDay }, (_, i) => {
      const dayNum = i + 1;
      const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      const log = history.find(h => h.date === dateStr);
      return { score: log ? calcScore(log) : 0, day: dayNum };
    });
  })();

  const cellSize = Math.floor((width - 32 - 4 * 6) / 7);

 const firstDate = history.length > 0
  ? new Date(Math.min(...history.map(d => new Date(d.date).getTime())))
  : new Date();
const isFirstMonth = selectedMonth === firstDate.getMonth() && selectedYear === firstDate.getFullYear();

function goToPrevMonth() {
  if (isFirstMonth) return;
  if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(y => y - 1); }
  else setSelectedMonth(m => m - 1);
}
function goToNextMonth() {
  if (isCurrentMonth) return;
  if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(y => y + 1); }
  else setSelectedMonth(m => m + 1);
}
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>

        <View style={{ paddingBottom: 20, paddingTop: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <View>
            <Text style={{ fontSize: 10, color: C.dim, letterSpacing: 3, textTransform: 'uppercase' }}>Identité</Text>
            <Text style={{ fontFamily: 'Cinzel', fontSize: 22, color: C.text, marginTop: 4 }}>Profil</Text>
          </View>
          <TouchableOpacity style={{ borderWidth: 1, borderColor: C.goldDim, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 }} onPress={() => setShowEdit(true)}>
            <Text style={{ color: C.gold, fontSize: 13 }}>✏️ Modifier</Text>
          </TouchableOpacity>
        </View>

        {/* IDENTITY CARD */}
        <View style={styles.identityCard}>
          <View style={styles.identityTop}>
            <View style={[styles.avatar, { borderColor: rank.color }]}>
              <Text style={{ fontFamily: 'Cinzel', fontSize: 28, color: rank.color }}>{(profile?.name ?? 'A').charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'Cinzel', fontSize: 18, color: C.text, letterSpacing: 1 }}>{profile?.name ?? 'Guerrier'}</Text>
              <Text style={{ fontSize: 11, color: C.dim, marginTop: 3 }}>{user?.email}</Text>
              <View style={{ marginTop: 8 }}><RankBadge totalXP={totalXP} size="normal" /></View>
            </View>
          </View>
          <View style={{ marginTop: 20 }}><XPBar totalXP={totalXP} /></View>
        </View>

        {/* STATS */}
        <Text style={styles.sectionTitle}>📊 Statistiques globales</Text>
        <View style={styles.statsGrid}>
          {[
            { num: totalXP, label: 'XP Total', color: C.gold },
            { num: streak, label: '🔥 Streak actuel', color: streak > 0 ? C.gold : C.dim },
            { num: bestStreak, label: '⚡ Meilleur streak', color: C.gold },
            { num: `${avgScore}%`, label: 'Score moyen', color: avgScore >= 70 ? C.green : C.gold },
            { num: totalWorkouts, label: '💪 Séances', color: C.gold },
            { num: perfectDays, label: '✦ Jours parfaits', color: C.gold },
          ].map((s, i) => (
            <View key={i} style={styles.statCard}>
              <Text style={[styles.statNum, { color: s.color }]}>{s.num}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* HEATMAP avec navigation */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, marginTop: 8 }}>
         <TouchableOpacity onPress={goToPrevMonth} style={{ padding: 8, opacity: isFirstMonth ? 0.3 : 1 }}>
            <Text style={{ color: C.gold, fontSize: 22 }}>‹</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowMonthPicker(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 10, color: C.gold, letterSpacing: 3, textTransform: 'uppercase' }}>📅 {monthLabel}</Text>
            <Text style={{ color: C.gold, fontSize: 12 }}>▾</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={goToNextMonth} style={{ padding: 8, opacity: isCurrentMonth ? 0.3 : 1 }}>
            <Text style={{ color: C.gold, fontSize: 22 }}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
          {monthDays.map((d) => {
            const op = d.score >= 80 ? 1 : d.score >= 50 ? 0.6 : d.score >= 20 ? 0.3 : 0;
            return (
              <View key={d.day} style={{ width: cellSize, height: cellSize + 10, borderRadius: 6, backgroundColor: op > 0 ? `rgba(201,168,76,${op})` : C.s2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.s3 }}>
                <Text style={{ fontSize: 10, color: op > 0 ? '#000' : C.dim, fontWeight: '600' }}>{d.day}</Text>
              </View>
            );
          })}
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Text style={{ fontSize: 10, color: C.dim }}>Moins actif</Text>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            {[0, 0.3, 0.6, 1].map((op, i) => (
              <View key={i} style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: op > 0 ? `rgba(201,168,76,${op})` : C.s2 }} />
            ))}
          </View>
          <Text style={{ fontSize: 10, color: C.dim }}>Plus actif</Text>
        </View>

        {/* MILESTONES */}
        <Text style={styles.sectionTitle}>🏆 Milestones streak</Text>
        <View style={{ gap: 10, marginBottom: 24 }}>
          {STREAK_MILESTONES.map(m => {
            const achieved = streak >= m.days;
            return (
              <View key={m.days} style={[styles.milestoneRow, achieved && { borderColor: m.color + '44', backgroundColor: m.color + '08' }]}>
                <Text style={{ fontSize: 22, opacity: achieved ? 1 : 0.3 }}>{m.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'Cinzel', fontSize: 13, letterSpacing: 1, color: achieved ? m.color : C.dim }}>{m.title}</Text>
                  <Text style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>{m.days} jours · {m.description}</Text>
                </View>
                {achieved ? <Text style={{ color: m.color, fontSize: 16 }}>✓</Text> : <Text style={{ color: C.dim, fontSize: 11 }}>{m.days - streak}j</Text>}
              </View>
            );
          })}
        </View>

        {/* HABITUDES */}
        <Text style={styles.sectionTitle}>💡 Régularité des habitudes</Text>
        <View style={{ backgroundColor: C.s1, borderWidth: 1, borderColor: C.s3, borderRadius: 14, padding: 16, gap: 14, marginBottom: 24 }}>
          {habitStats.map(h => (
            <View key={h.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={{ fontSize: 12, color: C.text, width: 105 }}>{h.label}</Text>
              <View style={{ flex: 1, height: 4, backgroundColor: C.s3, borderRadius: 4, overflow: 'hidden' }}>
                <View style={{ height: '100%', borderRadius: 4, width: `${h.pct}%` as any, backgroundColor: h.pct >= 70 ? C.green : h.pct >= 40 ? C.gold : C.red }} />
              </View>
              <Text style={{ fontSize: 11, color: C.dim, width: 36, textAlign: 'right', fontFamily: 'SpaceMono' }}>{h.pct}%</Text>
            </View>
          ))}
        </View>

        {/* RANGS */}
        <Text style={styles.sectionTitle}>⚔️ Progression des rangs</Text>
        <View style={{ gap: 8, marginBottom: 24 }}>
          {RANKS.map(r => {
            const achieved = totalXP >= r.minXP;
            const isCurrent = rank.level === r.level;
            return (
              <View key={r.level} style={[{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.s1, borderWidth: 1, borderColor: C.s3, borderRadius: 10, padding: 12 }, isCurrent && { borderColor: r.color, backgroundColor: r.color + '0A' }]}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: achieved ? r.color : C.s3 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'Cinzel', fontSize: 12, letterSpacing: 1, color: achieved ? r.color : C.dim }}>{r.name}{isCurrent ? ' ← actuel' : ''}</Text>
                  <Text style={{ fontSize: 10, color: C.dim }}>{r.minXP} XP requis</Text>
                </View>
                {achieved && <Text style={{ color: r.color, fontSize: 14 }}>✓</Text>}
              </View>
            );
          })}
        </View>
{/* NOTIFICATIONS */}
<Text style={styles.sectionTitle}>🔔 Notifications</Text>
<View style={{ backgroundColor: C.s1, borderWidth: 1, borderColor: C.s3, borderRadius: 14, padding: 16, marginBottom: 24 }}>
  <NotificationSettings />
</View>
        <TouchableOpacity style={{ marginBottom: 16, padding: 14, borderWidth: 1, borderColor: C.s3, borderRadius: 12, alignItems: 'center' }} onPress={signOut}>
          <Text style={{ color: C.dim, fontSize: 13 }}>Se déconnecter</Text>
        </TouchableOpacity>

      </ScrollView>

      {showEdit && <EditProfileModal profile={profile} onClose={() => setShowEdit(false)} onSave={updateProfile} />}
      {showMonthPicker && <MonthPickerModal current={{ month: selectedMonth, year: selectedYear }} history={history} onSelect={(m, y) => { setSelectedMonth(m); setSelectedYear(y); }} onClose={() => setShowMonthPicker(false)} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  identityCard: { backgroundColor: C.s1, borderWidth: 1, borderColor: C.goldDim, borderRadius: 20, padding: 20, marginBottom: 24 },
  identityTop: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: C.goldDim, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  sectionTitle: { fontSize: 10, color: C.gold, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12, marginTop: 8 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  statCard: { width: (Dimensions.get('window').width - 52) / 3, backgroundColor: C.s1, borderWidth: 1, borderColor: C.goldDim + '44', borderRadius: 14, padding: 14, alignItems: 'center' },
  statNum: { fontFamily: 'SpaceMono', fontSize: 22, lineHeight: 24 },
  statLabel: { fontSize: 9, color: C.dim, marginTop: 5, textAlign: 'center', letterSpacing: 1, textTransform: 'uppercase' },
  milestoneRow: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.s1, borderWidth: 1, borderColor: C.s3, borderRadius: 12, padding: 14 },
});

const edit = StyleSheet.create({
  label: { fontSize: 10, color: C.dim, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 },
  sectionTitle: { fontFamily: 'Cinzel', fontSize: 14, color: C.gold, letterSpacing: 2, marginTop: 24, marginBottom: 16 },
  input: { backgroundColor: C.s2, borderWidth: 1, borderColor: C.s3, borderRadius: 10, padding: 14, color: C.text, fontSize: 15, marginBottom: 16 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  unit: { color: C.dim, fontSize: 13, width: 36 },
});
