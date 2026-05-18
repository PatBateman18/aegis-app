// components/DailyQuests.tsx
import { View, Text, StyleSheet } from 'react-native';
import { C } from '@/constants/colors';
import { type Quest } from '@/constants/quests';
import { type DailyLog } from '@/constants/types';

type Props = {
  quests: Quest[];
  day: DailyLog;
  completedIds: Set<string>;
};

function QuestCard({ quest, day, completed }: { quest: Quest; day: DailyLog; completed: boolean }) {
  const active = quest.check(day);
  const done   = completed || active;

  return (
    <View style={[
      styles.card,
      done && { borderColor: quest.color + '55', backgroundColor: quest.color + '08' },
      quest.fixed && { borderColor: C.goldDim, backgroundColor: '#0D0900' },
    ]}>
      {/* Icône */}
      <View style={[
        styles.iconBox,
        { borderColor: done ? quest.color + '66' : C.s3, backgroundColor: done ? quest.color + '15' : C.s2 },
      ]}>
        <Text style={[styles.icon, { color: done ? quest.color : C.dim }]}>{quest.icon}</Text>
      </View>

      {/* Contenu */}
      <View style={{ flex: 1 }}>
        <View style={styles.titleRow}>
          {quest.fixed && (
            <View style={styles.fixedBadge}>
              <Text style={styles.fixedText}>FIXE</Text>
            </View>
          )}
          <Text style={[styles.title, { color: done ? quest.color : C.text }]}>{quest.title}</Text>
        </View>
        <Text style={styles.desc}>{quest.description}</Text>
      </View>

      {/* XP + statut */}
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <Text style={[styles.xp, { color: done ? quest.color : C.dim }]}>+{quest.xp} XP</Text>
        {done ? (
          <Text style={[styles.check, { color: quest.color }]}>✓</Text>
        ) : (
          <View style={[styles.progressDot, { backgroundColor: C.s3 }]} />
        )}
      </View>
    </View>
  );
}

export default function DailyQuests({ quests, day, completedIds }: Props) {
  const totalXP  = quests.reduce((acc, q) => acc + (completedIds.has(q.id) ? q.xp : 0), 0);
  const doneCount = quests.filter(q => completedIds.has(q.id)).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.sectionRow}>
          <View style={styles.sectionBar} />
          <Text style={styles.sectionTitle}>QUÊTES DU JOUR</Text>
        </View>
        <View style={styles.progressBadge}>
          <Text style={styles.progressText}>{doneCount}/{quests.length}</Text>
          {totalXP > 0 && <Text style={styles.earnedXP}>+{totalXP} XP</Text>}
        </View>
      </View>

      {/* Quêtes */}
      <View style={{ gap: 10 }}>
        {quests.map(q => (
          <QuestCard
            key={q.id}
            quest={q}
            day={day}
            completed={completedIds.has(q.id)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 14 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionBar:   { width: 3, height: 14, backgroundColor: C.gold, borderRadius: 2 },
  sectionTitle: { fontSize: 10, letterSpacing: 3, color: C.gold, textTransform: 'uppercase', fontWeight: '700' },
  progressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.s1,
    borderWidth: 1,
    borderColor: C.s3,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  progressText: { fontSize: 11, color: C.dim, fontFamily: 'SpaceMono' },
  earnedXP:     { fontSize: 11, color: C.gold, fontFamily: 'SpaceMono' },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.s1,
    borderWidth: 1,
    borderColor: C.s3,
    borderRadius: 14,
    padding: 14,
  },
  iconBox: {
    width: 40, height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontFamily: 'Cinzel', fontSize: 18 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  fixedBadge: {
    backgroundColor: C.goldDim,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  fixedText: { fontSize: 7, color: C.gold, letterSpacing: 1, fontWeight: '700' },
  title:    { fontSize: 13, fontFamily: 'Cinzel', letterSpacing: 0.5 },
  desc:     { fontSize: 11, color: C.dim, lineHeight: 16 },
  xp:       { fontSize: 11, fontFamily: 'SpaceMono', fontWeight: '700' },
  check:    { fontSize: 16, fontWeight: '700' },
  progressDot: { width: 8, height: 8, borderRadius: 4 },
});
