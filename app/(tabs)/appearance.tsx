import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useDay } from '@/hooks/useDay';
import { AccentProvider, Card, SectionTitle, Inp, ActionRow } from '@/components/ui';
import { C } from '@/constants/colors';
// ─── Accent couleur page ─────────────────────────────────────────────────────
const ACC  = '#7BC67A';
const ACCB = '#A3D8A2';
const ACCD = '#7BC67A22';
// ─────────────────────────────────────────────────────────────────────────────


export default function AppearanceScreen() {
  const { user } = useAuth();
  const { day, goals, updateDay, updateGoals } = useDay(user?.id);

  const daysSince = goals.last_haircut
    ? Math.floor((Date.now() - new Date(goals.last_haircut).getTime()) / 86400000)
    : null;
  const haircutAlert = daysSince !== null && daysSince > 21;

  return (
    <AccentProvider color={ACC}>
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>

        <View style={{ paddingBottom: 16, paddingTop: 8 }}>
          <Text style={{ fontSize: 10, color: C.dim, letterSpacing: 3, textTransform: 'uppercase' }}>Look & Hygiène</Text>
          <Text style={{ fontFamily: 'Cinzel', fontSize: 22, color: ACCB, marginTop: 4, letterSpacing: 4 }}>APPARENCE</Text>
        </View>

        <SectionTitle>Routine matin</SectionTitle>
        <View style={{ marginBottom: 14 }}>
          <ActionRow icon="🧴" label="Nettoyage visage" active={!!day.m_face} onPress={v => updateDay({ m_face: v })} />
          <ActionRow icon="💦" label="Hydratant visage" active={!!day.m_hydra} onPress={v => updateDay({ m_hydra: v })} />
          <ActionRow icon="☀️" label="SPF / Soin spécifique" active={!!day.m_skin} onPress={v => updateDay({ m_skin: v })} />
        </View>

        <SectionTitle>Routine soir</SectionTitle>
        <View style={{ marginBottom: 14 }}>
          <ActionRow icon="🌙" label="Nettoyage visage (soir)" active={!!day.e_face} onPress={v => updateDay({ e_face: v })} />
          <ActionRow icon="🌸" label="Crème de nuit" active={!!day.e_hydra} onPress={v => updateDay({ e_hydra: v })} />
          <ActionRow icon="🎯" label="Traitement spécifique" active={!!day.e_skin} onPress={v => updateDay({ e_skin: v })} />
        </View>

        <SectionTitle>Style & Tenue</SectionTitle>
        <View style={{ marginBottom: 14 }}>
          <ActionRow icon="👔" label="Tenue propre et soignée" active={!!day.outfit_ok} onPress={v => updateDay({ outfit_ok: v })} />
        </View>
        <Card>
          <Inp label="Notes style" value={day.style_notes}
            onChange={(v: string) => updateDay({ style_notes: v })}
            placeholder="Tenue du jour, inspiration, idées..." />
        </Card>

        <SectionTitle>Coiffure</SectionTitle>
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <View>
              <Text style={{ fontSize: 14, color: C.text }}>Dernière coupe</Text>
              <Text style={{ fontSize: 12, color: C.dim, marginTop: 3 }}>
                {goals.last_haircut
                  ? new Date(goals.last_haircut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                  : 'Non défini'}
              </Text>
            </View>
            {daysSince !== null && (
              <View style={{
                padding: 12, borderRadius: 12, alignItems: 'center',
                backgroundColor: haircutAlert ? '#1a0808' : C.s2,
                borderWidth: 1, borderColor: haircutAlert ? C.red : C.s3,
              }}>
                <Text style={{ fontFamily: 'SpaceMono', fontSize: 20, color: haircutAlert ? C.red : C.text, lineHeight: 22 }}>{daysSince}j</Text>
                <Text style={{ fontSize: 10, color: C.dim, marginTop: 2 }}>depuis</Text>
              </View>
            )}
          </View>
          {haircutAlert && (
            <View style={{ backgroundColor: '#1a0808', borderWidth: 1, borderColor: C.red, borderRadius: 8, padding: 10, marginBottom: 14 }}>
              <Text style={{ fontSize: 12, color: C.red }}>{daysSince} jours sans coupe — Pense à prendre rendez-vous.</Text>
            </View>
          )}
          <TouchableOpacity
            style={{ padding: 14, backgroundColor: C.s2, borderWidth: 1, borderColor: C.s3, borderRadius: 10, alignItems: 'center' }}
            onPress={() => updateGoals({ last_haircut: new Date().toISOString().split('T')[0] })}
          >
            <Text style={{ color: C.text, fontSize: 13 }}>✂️ Enregistrer une coupe aujourd'hui</Text>
          </TouchableOpacity>
        </Card>

      </ScrollView>
    </SafeAreaView>
    </AccentProvider>
  );
}
