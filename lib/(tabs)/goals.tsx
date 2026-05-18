import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useDay } from '@/hooks/useDay';
import { Card, SectionTitle, Inp } from '@/components/ui';
import { C } from '@/constants/colors';

export default function GoalsScreen() {
  const { user } = useAuth();
  const { goals, updateGoals } = useDay(user?.id);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>

        <View style={{ paddingBottom: 16, paddingTop: 8 }}>
          <Text style={{ fontSize: 10, color: C.dim, letterSpacing: 3, textTransform: 'uppercase' }}>Vision long terme</Text>
          <Text style={{ fontFamily: 'Cinzel', fontSize: 22, color: C.text, marginTop: 4 }}>Objectifs</Text>
        </View>

        <Card style={{ backgroundColor: '#150E00', borderColor: C.goldDim }}>
          <Text style={{ fontFamily: 'Cinzel', color: C.gold, fontSize: 12, marginBottom: 12, letterSpacing: 2 }}>✦ MA VISION</Text>
          <Inp value={goals.vision} onChange={(v: string) => updateGoals({ vision: v })}
            placeholder="Qui veux-tu être dans 1 an ? Décris ta version idéale sans limite..." multiline />
        </Card>

        <SectionTitle>Objectifs clés</SectionTitle>

        <Card>
          <Text style={{ fontSize: 10, color: C.dim, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>💪 Objectif physique</Text>
          <Inp value={goals.physical_goal} onChange={(v: string) => updateGoals({ physical_goal: v })}
            placeholder="Ex: Descendre à 95kg, définir les abdos" />
        </Card>

        <Card>
          <Text style={{ fontSize: 10, color: C.dim, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>🧠 Objectif mental</Text>
          <Inp value={goals.mental_goal} onChange={(v: string) => updateGoals({ mental_goal: v })}
            placeholder="Ex: Lire 12 livres, apprendre le trading" />
        </Card>

        <Card>
          <Text style={{ fontSize: 10, color: C.dim, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>👔 Objectif style</Text>
          <Inp value={goals.style_goal} onChange={(v: string) => updateGoals({ style_goal: v })}
            placeholder="Ex: Construire une garde-robe cohérente" />
        </Card>

        <Card>
          <Text style={{ fontSize: 10, color: C.dim, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>📅 Échéance</Text>
          <Inp value={goals.timeline} onChange={(v: string) => updateGoals({ timeline: v })}
            placeholder="Ex: Été 2025, dans 6 mois" />
        </Card>

        <SectionTitle>Mes règles personnelles</SectionTitle>
        <Card>
          <Inp value={goals.rules} onChange={(v: string) => updateGoals({ rules: v })}
            placeholder={"1. Je ne saute jamais deux séances consécutives\n2. Je mange en dessous de mon objectif chaque jour\n3. Je soigne mon apparence, chaque matin sans exception"}
            multiline />
        </Card>

      </ScrollView>
    </SafeAreaView>
  );
}
