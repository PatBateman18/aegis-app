import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  ScrollView, TextInput, ActivityIndicator, FlatList,
} from 'react-native';
import { Image } from 'expo-image';
import * as FileSystem from 'expo-file-system/legacy';
import { C } from '@/constants/colors';

const RAPIDAPI_KEY = '50d7faeb34mshda2e150c5c6facdp1b26c5jsnce2a05b64518';
const RAPIDAPI_HOST = 'exercisedb.p.rapidapi.com';
const BASE_URL = 'https://exercisedb.p.rapidapi.com';

const MUSCLE_GROUPS = [
  { id: 'chest', label: 'Pectoraux', emoji: '🫁' },
  { id: 'back', label: 'Dos', emoji: '🔙' },
  { id: 'shoulders', label: 'Épaules', emoji: '🏋️' },
  { id: 'upper arms', label: 'Bras', emoji: '💪' },
  { id: 'lower arms', label: 'Avant-bras', emoji: '🦾' },
  { id: 'upper legs', label: 'Cuisses', emoji: '🦵' },
  { id: 'lower legs', label: 'Mollets', emoji: '🦿' },
  { id: 'waist', label: 'Abdos', emoji: '🎯' },
  { id: 'cardio', label: 'Cardio', emoji: '❤️' },
];

type Exercise = {
  id: string;
  name: string;
  bodyPart: string;
  target: string;
  equipment: string;
  difficulty?: string;
  description?: string;
  instructions?: string[];
  secondaryMuscles?: string[];
};

const exerciseCache: Record<string, Exercise[]> = {};
const gifCache: Record<string, string> = {};

function capitalize(str: string) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Télécharge le GIF avec expo-file-system et retourne un URI local
async function fetchGif(exerciseId: string): Promise<string | null> {
  if (gifCache[exerciseId]) return gifCache[exerciseId];
  try {
    const localUri = `${FileSystem.cacheDirectory}exercise_${exerciseId}.gif`;
    const result = await FileSystem.downloadAsync(
      `${BASE_URL}/exercises/exercise/${exerciseId}/image`,
      localUri,
      {
        headers: {
          'x-rapidapi-key': RAPIDAPI_KEY,
          'x-rapidapi-host': RAPIDAPI_HOST,
        },
      }
    );

    if (result.status === 200) {
      gifCache[exerciseId] = result.uri;
      return result.uri;
    }
    return null;
  } catch (e) {
    console.log('GIF fetch error:', e);
    return null;
  }
}

// Composant qui charge et affiche un GIF
function GifImage({ exerciseId, style, size = 'small' }: {
  exerciseId: string;
  style: any;
  size?: 'small' | 'large';
}) {
  const [uri, setUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setUri(null);
    fetchGif(exerciseId).then(data => {
      if (!cancelled) {
        setUri(data);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [exerciseId]);

  if (loading) {
    return (
      <View style={[style, { backgroundColor: C.s3, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={C.gold} size={size === 'large' ? 'large' : 'small'} />
      </View>
    );
  }

  if (!uri) {
    return (
      <View style={[style, { backgroundColor: C.s3, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: size === 'large' ? 40 : 22 }}>💪</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={style}
      contentFit="contain"
    />
  );
}

// ─── EXERCISE DETAIL MODAL ───────────────────
function ExerciseDetailModal({
  exercise, onAdd, onClose,
}: {
  exercise: Exercise;
  onAdd: (name: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <View style={detail.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={{ color: C.dim, fontSize: 14 }}>← Retour</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <View style={detail.gifContainer}>
            <GifImage exerciseId={exercise.id} style={detail.gif} size="large" />
          </View>

          <Text style={detail.exName}>{capitalize(exercise.name)}</Text>

          <View style={detail.tags}>
            <View style={detail.tag}>
              <Text style={detail.tagLabel}>MUSCLE</Text>
              <Text style={detail.tagValue}>{capitalize(exercise.target)}</Text>
            </View>
            <View style={detail.tag}>
              <Text style={detail.tagLabel}>ÉQUIP.</Text>
              <Text style={detail.tagValue}>{capitalize(exercise.equipment)}</Text>
            </View>
            <View style={detail.tag}>
              <Text style={detail.tagLabel}>NIVEAU</Text>
              <Text style={detail.tagValue}>{capitalize(exercise.difficulty ?? '—')}</Text>
            </View>
          </View>

          {exercise.description && (
            <View style={detail.section}>
              <Text style={detail.sectionTitle}>📋 Description</Text>
              <Text style={detail.sectionText}>{exercise.description}</Text>
            </View>
          )}

          {(exercise.instructions?.length ?? 0) > 0 && (
            <View style={detail.section}>
              <Text style={detail.sectionTitle}>📌 Instructions</Text>
              {exercise.instructions!.map((step, i) => (
                <View key={i} style={detail.stepRow}>
                  <View style={detail.stepNum}>
                    <Text style={detail.stepNumText}>{i + 1}</Text>
                  </View>
                  <Text style={detail.stepText}>{step}</Text>
                </View>
              ))}
            </View>
          )}

          {(exercise.secondaryMuscles?.length ?? 0) > 0 && (
            <View style={detail.section}>
              <Text style={detail.sectionTitle}>💪 Muscles secondaires</Text>
              <Text style={detail.sectionText}>
                {exercise.secondaryMuscles!.map(capitalize).join(', ')}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={detail.addBtn}
            onPress={() => { onAdd(capitalize(exercise.name)); onClose(); }}
          >
            <Text style={detail.addBtnText}>+ Ajouter à la séance</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── EXERCISE PICKER MODAL ───────────────────
export function ExercisePicker({
  onSelect, onClose,
}: {
  onSelect: (name: string) => void;
  onClose: () => void;
}) {
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  async function fetchExercises(bodyPart: string) {
    if (exerciseCache[bodyPart]) {
      setExercises(exerciseCache[bodyPart]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `${BASE_URL}/exercises/bodyPart/${encodeURIComponent(bodyPart)}?limit=25`,
        {
          headers: {
            'x-rapidapi-key': RAPIDAPI_KEY,
            'x-rapidapi-host': RAPIDAPI_HOST,
          },
        }
      );
      const data = await res.json();
      exerciseCache[bodyPart] = data;
      setExercises(data);
    } catch (e) {
      console.log('ExerciseDB error:', e);
    }
    setLoading(false);
  }

  function selectMuscle(id: string) {
    setSelectedMuscle(id);
    setSearch('');
    fetchExercises(id);
  }

  const filtered = exercises.filter(ex =>
    ex.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <View style={picker.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={{ color: C.dim, fontSize: 14 }}>Fermer</Text>
          </TouchableOpacity>
          <Text style={picker.title}>EXERCICES</Text>
          <View style={{ width: 60 }} />
        </View>

        {!selectedMuscle ? (
          <ScrollView contentContainerStyle={picker.muscleGrid}>
            <Text style={picker.subtitle}>Choisis un groupe musculaire</Text>
            <View style={picker.grid}>
              {MUSCLE_GROUPS.map(m => (
                <TouchableOpacity
                  key={m.id}
                  style={picker.muscleCard}
                  onPress={() => selectMuscle(m.id)}
                >
                  <Text style={picker.muscleEmoji}>{m.emoji}</Text>
                  <Text style={picker.muscleLabel}>{m.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        ) : (
          <View style={{ flex: 1 }}>
            <View style={picker.searchRow}>
              <TouchableOpacity onPress={() => { setSelectedMuscle(null); setExercises([]); }}>
                <Text style={{ color: C.gold, fontSize: 13, marginRight: 12 }}>← Retour</Text>
              </TouchableOpacity>
              <TextInput
                style={picker.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="Rechercher..."
                placeholderTextColor={C.dim}
                autoCorrect={false}
              />
            </View>

            {loading ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator color={C.gold} size="large" />
                <Text style={{ color: C.dim, marginTop: 12, fontSize: 13 }}>
                  Chargement des exercices...
                </Text>
              </View>
            ) : (
              <FlatList
                data={filtered}
                keyExtractor={item => item.id}
                contentContainerStyle={{ padding: 16 }}
                windowSize={3}
                initialNumToRender={6}
                maxToRenderPerBatch={6}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={picker.exRow}
                    onPress={() => setSelectedExercise(item)}
                  >
                    <GifImage exerciseId={item.id} style={picker.exThumb} />
                    <View style={{ flex: 1 }}>
                      <Text style={picker.exName}>{capitalize(item.name)}</Text>
                      <Text style={picker.exMeta}>
                        {capitalize(item.target)} · {capitalize(item.equipment)}
                      </Text>
                    </View>
                    <Text style={{ color: C.gold, fontSize: 18 }}>›</Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        )}
      </View>

      {selectedExercise && (
        <ExerciseDetailModal
          exercise={selectedExercise}
          onAdd={onSelect}
          onClose={() => setSelectedExercise(null)}
        />
      )}
    </Modal>
  );
}

const picker = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderBottomWidth: 1, borderBottomColor: C.s3,
  },
  title: { fontFamily: 'Cinzel', fontSize: 16, color: C.goldBright, letterSpacing: 2 },
  subtitle: { fontSize: 13, color: C.dim, textAlign: 'center', marginBottom: 20 },
  muscleGrid: { padding: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  muscleCard: {
    width: '46%', backgroundColor: C.s2, borderRadius: 14,
    padding: 18, alignItems: 'center', borderWidth: 1, borderColor: C.s3,
  },
  muscleEmoji: { fontSize: 32, marginBottom: 8 },
  muscleLabel: { fontSize: 13, color: C.text, fontWeight: '600' },
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, borderBottomWidth: 1, borderBottomColor: C.s3,
  },
  searchInput: {
    flex: 1, backgroundColor: C.s2, borderRadius: 10, padding: 10,
    color: C.text, fontSize: 14, borderWidth: 1, borderColor: C.s3,
  },
  exRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.s2, borderRadius: 12, padding: 12,
    marginBottom: 10, borderWidth: 1, borderColor: C.s3,
  },
  exThumb: { width: 60, height: 60, borderRadius: 8, backgroundColor: C.s3 },
  exName: { fontSize: 14, color: C.text, fontWeight: '600' },
  exMeta: { fontSize: 11, color: C.dim, marginTop: 2 },
});

const detail = StyleSheet.create({
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: C.s3 },
  gifContainer: {
    backgroundColor: C.s2, borderRadius: 16, overflow: 'hidden',
    marginBottom: 20, height: 280,
  },
  gif: { width: '100%', height: 280 },
  exName: {
    fontFamily: 'Cinzel', fontSize: 20, color: C.goldBright,
    letterSpacing: 1, marginBottom: 16,
  },
  tags: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  tag: {
    flex: 1, backgroundColor: C.s2, borderRadius: 10,
    padding: 12, borderWidth: 1, borderColor: C.s3, alignItems: 'center',
  },
  tagLabel: { fontSize: 9, color: C.dim, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 },
  tagValue: { fontSize: 11, color: C.text, fontWeight: '600', textAlign: 'center' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 13, color: C.gold, fontWeight: '700', marginBottom: 10 },
  sectionText: { fontSize: 13, color: C.dim, lineHeight: 20 },
  stepRow: { flexDirection: 'row', gap: 10, marginBottom: 10, alignItems: 'flex-start' },
  stepNum: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: C.goldDim, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  stepNumText: { color: C.gold, fontSize: 11, fontWeight: '700' },
  stepText: { flex: 1, fontSize: 13, color: C.dim, lineHeight: 20 },
  addBtn: { backgroundColor: C.gold, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 10 },
  addBtnText: { color: '#000', fontWeight: '700', fontSize: 15, letterSpacing: 1 },
});
