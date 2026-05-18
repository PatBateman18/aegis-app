// components/WeeklySummary.tsx
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { C } from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import { calcDayXP } from '@/constants/rpg';
import { calcScore, HABIT_KEYS, HABIT_LABELS, DailyLog } from '@/constants/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getWeekDates(): string[] {
  const dates: string[] = [];
  const today = new Date();
  const day = today.getDay(); // 0=dim, 1=lun, ..., 6=sam
  const monday = new Date(today);
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

function dayLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('fr-FR', { weekday: 'short' })
    .slice(0, 3)
    .toUpperCase();
}

function getVerdict(avgScore: number, workouts: number): { label: string; sub: string; color: string } {
  if (avgScore >= 85 && workouts >= 4)
    return { label: '⚔️ SEMAINE DE CONQUÉRANT', sub: 'Tu as dominé cette semaine. Continue.', color: C.goldBright };
  if (avgScore >= 70)
    return { label: '🔥 SEMAINE SOLIDE', sub: 'Bonne régularité. Pousse encore.', color: C.gold };
  if (avgScore >= 50)
    return { label: '⚡ EN PROGRESSION', sub: "L'élan est là. Maintiens-le.", color: C.gold };
  if (avgScore >= 30)
    return { label: '🛡️ SEMAINE DIFFICILE', sub: 'La semaine prochaine sera meilleure.', color: C.dim };
  return { label: '💀 SEMAINE PERDUE', sub: "Tu sais ce qu'il reste à faire.", color: C.red };
}

type DaySlot = { date: string; log: DailyLog | null };

// ─── Composant principal ──────────────────────────────────────────────────────

export default function WeeklySummary({ userId }: { userId: string }) {
  const [slots, setSlots] = useState<DaySlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    load();
  }, [userId]);

  async function load() {
    setLoading(true);
    const dates = getWeekDates();
    const { data } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('date', dates[0])
      .lte('date', dates[6])
      .order('date', { ascending: true });

    const logMap: Record<string, DailyLog> = {};
    (data ?? []).forEach((d: DailyLog) => { logMap[d.date] = d; });

    setSlots(dates.map(date => ({ date, log: logMap[date] ?? null })));
    setLoading(false);
  }

  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator color={C.gold} size="small" />
      </View>
    );
  }

  // ── Calculs stats ──────────────────────────────────────────────────────────
  const activeDays  = slots.filter(s => s.log !== null);
  const scores      = activeDays.map(s => calcScore(s.log!));
  const avgScore    = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const weekXP      = activeDays.reduce((acc, s) => acc + calcDayXP(s.log!), 0);
  const workouts    = activeDays.filter(s => s.log?.workout_done).length;
  const perfectDays = activeDays.filter(s => calcScore(s.log!) === 100).length;

  const habitRates = HABIT_KEYS.map(k => ({
    key: k as string,
    label: HABIT_LABELS[k as string],
    rate: activeDays.length
      ? Math.round((activeDays.filter(s => !!(s.log as any)?.[k]).length / activeDays.length) * 100)
      : 0,
  })).sort((a, b) => b.rate - a.rate);

  const verdict = getVerdict(avgScore, workouts);
  const today   = new Date().toISOString().split('T')[0];

  return (
    <View style={styles.container}>

      {/* ── Header ────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.sectionBar} />
        <Text style={styles.headerTitle}>RÉSUMÉ DE LA SEMAINE</Text>
      </View>

      {/* ── Verdict ───────────────────────────────── */}
      <View style={[styles.verdictBox, { borderColor: verdict.color + '44', backgroundColor: verdict.color + '0A' }]}>
        <Text style={[styles.verdictLabel, { color: verdict.color }]}>{verdict.label}</Text>
        <Text style={styles.verdictSub}>{verdict.sub}</Text>
      </View>

      {/* ── Barre des 7 jours ─────────────────────── */}
      <View style={styles.barRow}>
        {slots.map(({ date, log }) => {
          const score   = log ? calcScore(log) : 0;
          const isToday = date === today;
          const barH    = log ? Math.max(6, Math.round((score / 100) * 56)) : 4;
          const barColor = score >= 80 ? C.gold : score >= 50 ? C.goldDim : C.s3;

          return (
            <View key={date} style={styles.barCol}>
              <View style={styles.barBg}>
                <View style={[
                  styles.barFill,
                  { height: barH, backgroundColor: isToday ? C.goldBright : barColor },
                ]} />
              </View>
              <Text style={[styles.barLabel, isToday && { color: C.goldBright }]}>
                {dayLabel(date)}
              </Text>
              {log && <Text style={styles.barScore}>{score}%</Text>}
            </View>
          );
        })}
      </View>

      {/* ── Stats 2×2 ─────────────────────────────── */}
      <View style={styles.statsGrid}>
        <StatBox value={`${avgScore}%`} label="Score moyen"    color={avgScore >= 70 ? C.gold : C.dim} />
        <StatBox value={`${weekXP}`}    label="XP gagnés"      color={C.gold} unit="xp" />
        <StatBox value={`${workouts}`}  label="Séances"        color={workouts >= 3 ? C.gold : C.dim} unit="/7j" />
        <StatBox value={`${perfectDays}`} label="Jours parfaits" color={perfectDays > 0 ? C.goldBright : C.dim} />
      </View>

      {/* ── Habitudes ─────────────────────────────── */}
      {activeDays.length > 0 ? (
        <View style={styles.habitsBox}>
          <Text style={styles.habitsTitle}>RÉGULARITÉ</Text>
          {habitRates.map(({ key, label, rate }) => (
            <View key={key} style={styles.habitRow}>
              <Text style={styles.habitLabel}>{label}</Text>
              <View style={styles.habitBarBg}>
                <View style={[
                  styles.habitBarFill,
                  { width: `${rate}%` as any, backgroundColor: rate === 100 ? C.green : rate >= 60 ? C.gold : rate >= 30 ? C.goldDim : C.s3 },
                ]} />
              </View>
              <Text style={[styles.habitRate, { color: rate === 100 ? C.green : rate >= 60 ? C.gold : C.dim }]}>
                {rate}%
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>Aucune donnée cette semaine.</Text>
          <Text style={styles.emptyText}>Lance-toi dès aujourd'hui.</Text>
        </View>
      )}

    </View>
  );
}

// ─── StatBox ──────────────────────────────────────────────────────────────────

function StatBox({ value, label, color, unit }: { value: string; label: string; color: string; unit?: string }) {
  return (
    <View style={styles.statBox}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2 }}>
        <Text style={[styles.statValue, { color }]}>{value}</Text>
        {unit && <Text style={styles.statUnit}>{unit}</Text>}
      </View>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    backgroundColor: C.s1, borderWidth: 1, borderColor: C.s3,
    borderRadius: 14, padding: 16, marginBottom: 14,
  },
  loadingBox: {
    backgroundColor: C.s1, borderWidth: 1, borderColor: C.s3,
    borderRadius: 14, padding: 32, alignItems: 'center', marginBottom: 14,
  },
  header:      { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  sectionBar:  { width: 3, height: 14, backgroundColor: C.gold, borderRadius: 2 },
  headerTitle: { fontSize: 10, letterSpacing: 3, color: C.gold, textTransform: 'uppercase', fontWeight: '700' },
  verdictBox:  { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 16 },
  verdictLabel:{ fontFamily: 'Cinzel', fontSize: 13, letterSpacing: 1, marginBottom: 4 },
  verdictSub:  { fontSize: 12, color: C.dim },
  barRow:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  barCol:      { alignItems: 'center', flex: 1 },
  barBg: {
    height: 60, width: '70%', backgroundColor: C.s3, borderRadius: 4,
    justifyContent: 'flex-end', overflow: 'hidden', marginBottom: 6,
  },
  barFill:     { width: '100%', borderRadius: 4 },
  barLabel:    { fontSize: 9, color: C.dim, letterSpacing: 1, textTransform: 'uppercase' },
  barScore:    { fontSize: 8, color: C.dim, marginTop: 2 },
  statsGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  statBox: {
    flex: 1, minWidth: '45%', backgroundColor: C.s2,
    borderRadius: 10, padding: 12, borderWidth: 1, borderColor: C.s3,
  },
  statValue:   { fontFamily: 'SpaceMono', fontSize: 22, lineHeight: 26, fontWeight: '700' },
  statUnit:    { fontSize: 11, color: C.dim },
  statLabel:   { fontSize: 10, color: C.dim, marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 },
  habitsBox:   { borderTopWidth: 1, borderTopColor: C.s3, paddingTop: 14 },
  habitsTitle: { fontSize: 10, color: C.dim, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 },
  habitRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  habitLabel:  { fontSize: 12, color: C.dim, width: 90 },
  habitBarBg:  { flex: 1, height: 4, backgroundColor: C.s3, borderRadius: 4, overflow: 'hidden' },
  habitBarFill:{ height: '100%', borderRadius: 4 },
  habitRate:   { fontSize: 11, width: 36, textAlign: 'right', fontWeight: '700' },
  emptyBox:    { alignItems: 'center', paddingVertical: 16 },
  emptyText:   { fontSize: 13, color: C.dim, lineHeight: 22 },
});
