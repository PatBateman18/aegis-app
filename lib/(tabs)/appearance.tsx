import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useDay } from '@/hooks/useDay';
import { Card, SectionTitle, Inp, ToggleRow } from '@/components/ui';
import { C } from '@/constants/colors';

export default function AppearanceScreen() {
  const { user } = useAuth();
  const { day, goals, updateDay, updateGoals } = useDay(user?.id);

  const daysSince = goals.last_haircut
    ? Math.floor((Date.now() - new Date(goals.last_haircut).getTime()) / 86400000)
    : null;
  const haircutAlert = daysSince !== null && daysSince > 21;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>

        <View style={{ paddingBottom: 16, paddingTop: 8 }}>
          <Text style={{ fontSize: 10, color: C.dim, letterSpacing: 3, textTransform: 'uppercase' }}>Look & Hygiène</Text>
          <Text style={{ fontFamily: 'Cinzel', fontSize: 22, color: C.text, marginTop: 4 }}>Apparence</Text>
        </View>

        <SectionTitle>Routine matin</SectionTitle>
        <Card>
          <ToggleRow label="🚿 Nettoyer le visage" value={!!day.m_face} onChange={v => updateDay({ m_face: v })} />
          <ToggleRow label="💧 Hydratant visage" value={!!day.m_hydra} onChange={v => updateDay({ m_hydra: v })} />
          <ToggleRow label="☀️ SPF / Soin spécifique" sub="Protection solaire, sérum..." value={!!day.m_skin} onChange={v => updateDay({ m_skin: v })} />
        </Card>

        <SectionTitle>Routine soir</SectionTitle>
        <Card>
          <ToggleRow label="🌙 Nettoyer le visage" value={!!day.e_face} onChange={v => updateDay({ e_face: v })} />
          <ToggleRow label="🧴 Crème de nuit" value={!!day.e_hydra} onChange={v => updateDay({ e_hydra: v })} />
          <ToggleRow label="✨ Traitement spécifique" sub="Acné, contour des yeux..." value={!!day.e_skin} onChange={v => updateDay({ e_skin: v })} />
        </Card>

        <SectionTitle>Style & Tenue</SectionTitle>
        <Card>
          <ToggleRow label="👔 Tenue propre et soignée" value={!!day.outfit_ok} onChange={v => updateDay({ outfit_ok: v })} />
          <View style={{ paddingTop: 14 }}>
            <Inp label="Notes style" value={day.style_notes}
              onChange={(v: string) => updateDay({ style_notes: v })}
              placeholder="Tenue du jour, inspiration, idées..." />
          </View>
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
              <Text style={{ fontSize: 12, color: C.red }}>⚠️ {daysSince} jours sans coupe — Pense à prendre rendez-vous.</Text>
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
  );
}
