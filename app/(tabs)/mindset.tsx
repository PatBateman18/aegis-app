import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useDay } from '@/hooks/useDay';
import { AccentProvider, Card, SectionTitle, Inp, ActionRow, ScoreRing } from '@/components/ui';
import { C } from '@/constants/colors';
import { calcScore } from '@/constants/types';
import * as Haptics from 'expo-haptics';
// ─── Accent couleur page ─────────────────────────────────────────────────────
const ACC  = '#38BDF8';
const ACCB = '#7DD3F8';
const ACCD = '#38BDF822';
// ─────────────────────────────────────────────────────────────────────────────



// ─── Icônes par habitude ─────────────────────────────────────────────────────
const CHECKS_META: Record<string, { icon: string }> = {
  workout_done:  { icon: '⚔️' },
  calories_ok:   { icon: '🍎' },
  learning_done: { icon: '📚' },
  m_face:        { icon: '✨' },
  outfit_ok:     { icon: '👕' },
  morning_water: { icon: '💧' },
};

const CHECKS = [
  { key: 'workout_done',  label: 'Séance d\'entraînement',  },
  { key: 'calories_ok',   label: 'Calories respectées',     },
  { key: 'learning_done', label: 'Apprentissage',           },
  { key: 'm_face',        label: 'Routine matin',           },
  { key: 'outfit_ok',     label: 'Tenue soignée',           },
  { key: 'morning_water', label: 'Hydratation matinale',    },
];

export default function MindsetScreen() {
  const { user } = useAuth();
  const { day, updateDay } = useDay(user?.id);
  const score = calcScore(day);
  const done = CHECKS.filter(c => !!(day as any)[c.key]).length;
  const scoreLabel = score >= 90 ? 'CONQUÉRANT' : score >= 70 ? 'DISCIPLINÉ' : score >= 40 ? 'EN MARCHE' : 'À CONSTRUIRE';
  const scoreColor = score >= 80 ? C.green : score >= 50 ? ACC : C.red;

  return (
    <AccentProvider color={ACC}>
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>

        <View style={{ paddingBottom: 16, paddingTop: 8 }}>
          <Text style={{ fontSize: 10, color: C.dim, letterSpacing: 3, textTransform: 'uppercase' }}>Mental & Discipline</Text>
         <Text style={{ fontFamily: 'Cinzel', fontSize: 22, color: ACCB, marginTop: 4, letterSpacing: 4 }}>MINDSET</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20, borderWidth: 1, borderColor: ACCD, backgroundColor: '#150E00', borderRadius: 14, padding: 18, marginBottom: 14 }}>
          <ScoreRing score={score} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'Cinzel', fontSize: 15, color: scoreColor }}>{scoreLabel}</Text>
            <Text style={{ color: C.dim, fontSize: 12, marginTop: 5 }}>{done}/6 habitudes validées</Text>
            <View style={{ flexDirection: 'row', gap: 5, marginTop: 10 }}>
              {CHECKS.map((_, i) => (
                <View key={i} style={{ flex: 1, height: 4, borderRadius: 4, backgroundColor: i < done ? ACC : C.s3 }} />
              ))}
            </View>
          </View>
        </View>

        <SectionTitle>Checklist discipline</SectionTitle>
        <View style={{ marginBottom: 14 }}>
          {CHECKS.map(c => (
            <ActionRow
              key={c.key}
              icon={CHECKS_META[c.key]?.icon ?? '✦'}
              label={c.label}
              sub={c.sub}
              active={!!(day as any)[c.key]}
              onPress={v => {
                Haptics.impactAsync(v
                  ? Haptics.ImpactFeedbackStyle.Medium
                  : Haptics.ImpactFeedbackStyle.Light
                );
                const updates: any = { [c.key]: v };
                if (c.key === 'm_face') {
                  updates.m_face = v; updates.m_hydra = v; updates.m_skin = v;
                  updates.e_face = v; updates.e_hydra = v; updates.e_skin = v;
                }
                updateDay(updates);
              }}
            />
          ))}
        </View>

        <SectionTitle>Focus du jour</SectionTitle>
        <Card>
          <Inp label="Sur quoi tu te concentres ?" value={day.focus}
            onChange={(v: string) => updateDay({ focus: v })}
            placeholder="Ex: Tenir mes macros + séance dos intensive" />
        </Card>

        <SectionTitle>Journal rapide</SectionTitle>
        <Card>
          <Text style={{ fontSize: 10, color: C.dim, marginBottom: 10, letterSpacing: 2, textTransform: 'uppercase' }}>
            Bilan du jour (2–3 lignes max)
          </Text>
          <Inp value={day.journal} onChange={(v: string) => updateDay({ journal: v })}
            placeholder="Ce que j'ai accompli. Ce qui peut mieux aller..." multiline />
        </Card>

      </ScrollView>
    </SafeAreaView>
    </AccentProvider>
  );
}
