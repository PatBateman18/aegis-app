// app/journal-history.tsx

import { useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAmbientSound } from '@/hooks/useAmbientSound';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useDay } from '@/hooks/useDay';
import { C } from '@/constants/colors';

const GOLD  = '#C9A84C';
const GOLDB = '#E8C46A';

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
}

export default function JournalHistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { playAmbient } = useAmbientSound();

  useFocusEffect(useCallback(() => {
    playAmbient('journal');
  }, []));
  const { day, history } = useDay(user?.id);

  const entries = [...history.filter(h => h.date !== day.date), day]
    .filter(d => d.journal?.trim())
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0800' }} edges={[]}>
      {/* ── HEADER ── */}
      <View style={{ paddingTop: insets.top + 8, paddingBottom: 16, paddingHorizontal: 20, alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 8 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: GOLD + '33', alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ color: GOLD, fontSize: 18 }}>‹</Text>
          </TouchableOpacity>
          <Text style={{ fontFamily: 'Cinzel', fontSize: 20, color: GOLDB, letterSpacing: 3, fontWeight: '700' }}>JOURNAL RAPIDE</Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
          <View style={{ width: 24, height: 1, backgroundColor: GOLD + '55' }} />
          <Text style={{ color: GOLD, fontSize: 10 }}>✦</Text>
          <View style={{ width: 24, height: 1, backgroundColor: GOLD + '55' }} />
        </View>
        <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', marginTop: 8 }}>
          Écris. Clarifie. Progresse.
        </Text>
      </View>

      {/* ── LISTE DES ENTRÉES ── */}
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24, gap: 10 }}
        showsVerticalScrollIndicator={false}
      >
        {entries.length === 0 ? (
          <View style={{ backgroundColor: '#0F0C04', borderRadius: 16, borderWidth: 1, borderColor: GOLD + '22', padding: 24, alignItems: 'center', marginTop: 20 }}>
            <Text style={{ fontSize: 13, color: C.dim, textAlign: 'center', fontStyle: 'italic' }}>
              Aucune entrée pour l'instant.{'\n'}Écris ta première depuis la page Profil.
            </Text>
          </View>
        ) : (
          entries.map(e => (
            <View key={e.date} style={{ backgroundColor: '#0F0C04', borderRadius: 16, borderWidth: 1, borderColor: GOLD + '22', padding: 16 }}>
              <Text style={{ fontSize: 10, color: GOLD, letterSpacing: 2, fontWeight: '700', marginBottom: 8 }}>
                {formatDateLabel(e.date)}
              </Text>
              <Text style={{ fontSize: 14, color: C.text, lineHeight: 22, fontStyle: 'italic' }}>
                "{e.journal}"
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
