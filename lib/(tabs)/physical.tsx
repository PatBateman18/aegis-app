import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, Alert, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useDay } from '@/hooks/useDay';
import { Card, SectionTitle, Inp, ToggleRow, ProgressBar } from '@/components/ui';
import { C } from '@/constants/colors';
import { ExercisePicker } from '@/components/ExercisePicker';

type Set = { weight: string; reps: string };
type Exercise = { name: string; sets: Set[] };
type Session = { id: string; name: string; exercises: Exercise[] };
type WorkoutData = { sessions: Session[]; activeId: string | null };

function parseWorkout(raw: string | undefined): WorkoutData {
  if (!raw) return { sessions: [], activeId: null };
  try {
    const p = JSON.parse(raw);
    if (p.sessions) return p;
    return { sessions: [], activeId: null };
  } catch {
    return { sessions: [], activeId: null };
  }
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function SessionModal({
  session, onClose, onUpdate,
}: {
  session: Session;
  onClose: () => void;
  onUpdate: (s: Session) => void;
}) {
  const [data, setData] = useState<Session>(session);
  const [showPicker, setShowPicker] = useState(false);

  function save(updated: Session) { setData(updated); onUpdate(updated); }

  function addExercise(name: string) {
    save({ ...data, exercises: [...data.exercises, { name, sets: [{ weight: '', reps: '' }] }] });
  }

  function updateExName(i: number, name: string) {
    const exs = [...data.exercises];
    exs[i] = { ...exs[i], name };
    save({ ...data, exercises: exs });
  }

  function addSet(ei: number) {
    const exs = [...data.exercises];
    exs[ei] = { ...exs[ei], sets: [...exs[ei].sets, { weight: '', reps: '' }] };
    save({ ...data, exercises: exs });
  }

  function updateSet(ei: number, si: number, field: 'weight' | 'reps', val: string) {
    const exs = [...data.exercises];
    const sets = [...exs[ei].sets];
    sets[si] = { ...sets[si], [field]: val };
    exs[ei] = { ...exs[ei], sets };
    save({ ...data, exercises: exs });
  }

  function removeExercise(i: number) {
    Alert.alert('Supprimer ?', data.exercises[i].name || 'Cet exercice', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => {
        const exs = [...data.exercises];
        exs.splice(i, 1);
        save({ ...data, exercises: exs });
      }},
    ]);
  }

  function removeSet(ei: number, si: number) {
    const exs = [...data.exercises];
    const sets = [...exs[ei].sets];
    sets.splice(si, 1);
    exs[ei] = { ...exs[ei], sets };
    save({ ...data, exercises: exs });
  }

  const totalSets = data.exercises.reduce((acc, ex) => acc + ex.sets.filter(s => s.weight || s.reps).length, 0);
  const totalEx = data.exercises.filter(ex => ex.name).length;

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: C.s3 }}>
          <TouchableOpacity onPress={onClose}>
            <Text style={{ color: C.dim, fontSize: 14 }}>Fermer</Text>
          </TouchableOpacity>
          <Text style={{ fontFamily: 'Cinzel', fontSize: 16, color: C.goldBright, letterSpacing: 2 }}>{data.name}</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 16, gap: 24, borderBottomWidth: 1, borderBottomColor: C.s3 }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontFamily: 'SpaceMono', fontSize: 22, color: C.gold }}>{totalEx}</Text>
            <Text style={{ fontSize: 10, color: C.dim, marginTop: 2, textTransform: 'uppercase', letterSpacing: 1 }}>exercices</Text>
          </View>
          <View style={{ width: 1, height: 30, backgroundColor: C.s3 }} />
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontFamily: 'SpaceMono', fontSize: 22, color: C.gold }}>{totalSets}</Text>
            <Text style={{ fontSize: 10, color: C.dim, marginTop: 2, textTransform: 'uppercase', letterSpacing: 1 }}>séries</Text>
          </View>
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={120}>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
            {data.exercises.map((ex, ei) => (
              <View key={ei} style={{ backgroundColor: C.s2, borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: C.s3 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <TextInput
                    style={{ flex: 1, color: C.text, fontSize: 15, fontWeight: '600', borderBottomWidth: 1, borderBottomColor: C.goldDim, paddingBottom: 6 }}
                    defaultValue={ex.name}
                    onEndEditing={e => updateExName(ei, e.nativeEvent.text)}
                    placeholder="Nom de l'exercice..."
                    placeholderTextColor={C.dim}
                    autoCorrect={false}
                    spellCheck={false}
                  />
                  <TouchableOpacity onPress={() => removeExercise(ei)} style={{ padding: 6 }}>
                    <Text style={{ color: C.red, fontSize: 16 }}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 }}>
                  <Text style={{ fontSize: 9, color: C.dim, letterSpacing: 2, textTransform: 'uppercase', width: 32, textAlign: 'center' }}>#</Text>
                  <Text style={{ fontSize: 9, color: C.dim, letterSpacing: 2, textTransform: 'uppercase', flex: 1, textAlign: 'center' }}>POIDS (kg)</Text>
                  <Text style={{ fontSize: 9, color: C.dim, letterSpacing: 2, textTransform: 'uppercase', flex: 1, textAlign: 'center' }}>REPS</Text>
                  <View style={{ width: 28 }} />
                </View>

                {ex.sets.map((set, si) => (
                  <View key={si} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: C.goldDim, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: C.gold, fontSize: 12, fontWeight: '700' }}>{si + 1}</Text>
                    </View>
                    <TextInput
                      style={{ flex: 1, backgroundColor: C.s1, borderWidth: 1, borderColor: C.s3, borderRadius: 8, padding: 8, color: C.text, fontSize: 14, textAlign: 'center' }}
                      value={set.weight}
                      onChangeText={v => updateSet(ei, si, 'weight', v)}
                      placeholder="—"
                      placeholderTextColor={C.dim}
                      keyboardType="numeric"
                    />
                    <TextInput
                      style={{ flex: 1, backgroundColor: C.s1, borderWidth: 1, borderColor: C.s3, borderRadius: 8, padding: 8, color: C.text, fontSize: 14, textAlign: 'center' }}
                      value={set.reps}
                      onChangeText={v => updateSet(ei, si, 'reps', v)}
                      placeholder="—"
                      placeholderTextColor={C.dim}
                      keyboardType="numeric"
                    />
                    <TouchableOpacity onPress={() => removeSet(ei, si)} style={{ width: 28, alignItems: 'center' }}>
                      <Text style={{ color: C.dim, fontSize: 13 }}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}

                <TouchableOpacity
                  style={{ marginTop: 4, padding: 8, borderRadius: 8, borderWidth: 1, borderColor: C.s3, borderStyle: 'dashed', alignItems: 'center' }}
                  onPress={() => addSet(ei)}
                >
                  <Text style={{ color: C.dim, fontSize: 12 }}>+ Série</Text>
                </TouchableOpacity>
              </View>
            ))}

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                style={{ flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: C.gold, borderStyle: 'dashed', alignItems: 'center', gap: 6, backgroundColor: C.goldDim + '44' }}
                onPress={() => setShowPicker(true)}
              >
                <Text style={{ fontSize: 20 }}>🔍</Text>
                <Text style={{ color: C.gold, fontSize: 13, fontWeight: '600' }}>Chercher un exo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: C.gold, borderStyle: 'dashed', alignItems: 'center', gap: 6 }}
                onPress={() => addExercise('')}
              >
                <Text style={{ fontSize: 20 }}>✏️</Text>
                <Text style={{ color: C.gold, fontSize: 13, fontWeight: '600' }}>Écrire manuellement</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>

      {showPicker && (
        <ExercisePicker
          onSelect={(name) => { addExercise(name); setShowPicker(false); }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </Modal>
  );
}

export default function PhysicalScreen() {
  const { user, profile } = useAuth();
  const { day, history, updateDay } = useDay(user?.id);
  const [openSession, setOpenSession] = useState<Session | null>(null);

  const calTarget = (profile as any)?.cal_target ?? 2300;
  const protTarget = (profile as any)?.prot_target ?? 180;
  const cal = day.calories ?? 0;
  const prot = day.protein ?? 0;
  const calColor = cal > calTarget ? C.red : C.gold;
  const protColor = prot >= protTarget ? C.green : C.blue;

  const workoutData = parseWorkout(day.workout_type);
  const weightData = history.filter(d => d.weight).slice(0, 20).reverse();
  const calData = history.filter(d => d.calories).slice(0, 14).reverse();

  function saveWorkout(data: WorkoutData) {
    updateDay({ workout_type: JSON.stringify(data) });
  }

  function addSession() {
    Alert.prompt('Nouvelle séance', 'Nom de la séance (ex: Pecs / Épaules)', (name) => {
      if (!name?.trim()) return;
      const newSession: Session = { id: uid(), name: name.trim(), exercises: [] };
      saveWorkout({ sessions: [...workoutData.sessions, newSession], activeId: newSession.id });
      setOpenSession(newSession);
    }, 'plain-text', '');
  }

  function deleteSession(id: string) {
    Alert.alert('Supprimer cette séance ?', 'Cette action est irréversible.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => {
        saveWorkout({ sessions: workoutData.sessions.filter(s => s.id !== id), activeId: null });
      }},
    ]);
  }

  function handleSessionUpdate(updated: Session) {
    const sessions = workoutData.sessions.map(s => s.id === updated.id ? updated : s);
    saveWorkout({ ...workoutData, sessions });
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>

        <View style={{ paddingBottom: 16, paddingTop: 8 }}>
          <Text style={{ fontSize: 10, color: C.dim, letterSpacing: 3, textTransform: 'uppercase' }}>Transformation physique</Text>
          <Text style={{ fontFamily: 'Cinzel', fontSize: 22, color: C.text, marginTop: 4 }}>Corps</Text>
        </View>

        <SectionTitle>Données du jour</SectionTitle>
        <Card>
          <View style={{ flexDirection: 'row' }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Inp label="Poids" value={day.weight?.toString()} unit="kg" keyboardType="numeric"
                onChange={(v: string) => updateDay({ weight: parseFloat(v) || undefined })} placeholder="—" />
              <Inp label="Protéines" value={day.protein?.toString()} unit="g" keyboardType="numeric"
                onChange={(v: string) => updateDay({ protein: parseInt(v) || undefined })} placeholder="—" />
            </View>
            <View style={{ flex: 1, paddingLeft: 12, borderLeftWidth: 1, borderLeftColor: C.s3 }}>
              <Inp label="Calories" value={day.calories?.toString()} unit="kcal" keyboardType="numeric"
                onChange={(v: string) => updateDay({ calories: parseInt(v) || undefined })} placeholder="—" />
              <Inp label="Cardio" value={day.cardio_min?.toString()} unit="min" keyboardType="numeric"
                onChange={(v: string) => updateDay({ cardio_min: parseInt(v) || undefined })} placeholder="—" />
            </View>
          </View>
        </Card>

        <Card>
          <View style={{ marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ fontSize: 13, color: C.text }}>Calories</Text>
              <Text style={{ fontFamily: 'SpaceMono', fontSize: 12 }}>
                <Text style={{ color: calColor }}>{day.calories ?? '—'}</Text>
                <Text style={{ color: C.dim }}> / {calTarget} kcal</Text>
              </Text>
            </View>
            <ProgressBar value={cal} max={calTarget} color={calColor} />
          </View>
          <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ fontSize: 13, color: C.text }}>Protéines</Text>
              <Text style={{ fontFamily: 'SpaceMono', fontSize: 12 }}>
                <Text style={{ color: protColor }}>{day.protein ?? '—'}</Text>
                <Text style={{ color: C.dim }}> / {protTarget} g</Text>
              </Text>
            </View>
            <ProgressBar value={prot} max={protTarget} color={protColor} />
          </View>
        </Card>

        <SectionTitle>Séance d'entraînement</SectionTitle>
        <Card>
          <ToggleRow label="💪 Séance réalisée" value={!!day.workout_done}
            onChange={v => updateDay({ workout_done: v })} />

          {day.workout_done && (
            <View style={{ marginTop: 16 }}>
              {workoutData.sessions.map(session => {
                const exCount = session.exercises.filter(e => e.name).length;
                const setCount = session.exercises.reduce((a, e) => a + e.sets.filter(s => s.weight || s.reps).length, 0);
                return (
                  <TouchableOpacity key={session.id}
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.s2, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.s3 }}
                    onPress={() => setOpenSession(session)}
                    onLongPress={() => deleteSession(session.id)}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                      <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: C.goldDim, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 18 }}>💪</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, color: C.text, fontWeight: '600' }}>{session.name}</Text>
                        <Text style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>
                          {exCount > 0 ? `${exCount} exercice${exCount > 1 ? 's' : ''} · ${setCount} séries` : 'Appuie pour ajouter des exercices'}
                        </Text>
                      </View>
                    </View>
                    <Text style={{ color: C.gold, fontSize: 20 }}>›</Text>
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity
                style={{ padding: 14, borderRadius: 12, borderWidth: 1, borderColor: C.gold, borderStyle: 'dashed', alignItems: 'center', backgroundColor: C.goldDim + '44' }}
                onPress={addSession}
              >
                <Text style={{ color: C.gold, fontSize: 14, fontWeight: '600' }}>+ Nouvelle séance</Text>
              </TouchableOpacity>

              {workoutData.sessions.length > 0 && (
                <Text style={{ fontSize: 10, color: C.dim, textAlign: 'center', marginTop: 10 }}>Appui long pour supprimer une séance</Text>
              )}
            </View>
          )}
        </Card>

        {weightData.length > 1 && (
          <>
            <SectionTitle>Évolution du poids</SectionTitle>
            <Card style={{ paddingHorizontal: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 100, gap: 4, paddingBottom: 20 }}>
                {weightData.map((d, i) => {
                  const vals = weightData.map(x => x.weight ?? 0);
                  const mn = Math.min(...vals), mx = Math.max(...vals);
                  const h = Math.max(8, (((d.weight ?? 0) - mn) / (mx - mn || 1)) * 80);
                  return (
                    <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                      <View style={{ width: '100%', height: h, borderRadius: 3, backgroundColor: C.gold, opacity: 0.7 }} />
                      <Text style={{ fontSize: 8, color: C.dim }}>{new Date(d.date).getDate()}</Text>
                    </View>
                  );
                })}
              </View>
            </Card>
          </>
        )}

        {calData.length > 1 && (
          <>
            <SectionTitle>Calories — 14 derniers jours</SectionTitle>
            <Card style={{ paddingHorizontal: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 100, gap: 4, paddingBottom: 20 }}>
                {calData.map((d, i) => {
                  const v = d.calories ?? 0;
                  const mx = Math.max(...calData.map(x => x.calories ?? 0), calTarget);
                  const h = Math.max(4, (v / mx) * 80);
                  return (
                    <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                      <View style={{ width: '100%', height: h, borderRadius: 3, backgroundColor: v <= calTarget ? C.goldDim : C.red }} />
                      <Text style={{ fontSize: 8, color: C.dim }}>{new Date(d.date).getDate()}</Text>
                    </View>
                  );
                })}
              </View>
            </Card>
          </>
        )}

      </ScrollView>

      {openSession && (
        <SessionModal
          session={openSession}
          onClose={() => setOpenSession(null)}
          onUpdate={handleSessionUpdate}
        />
      )}
    </SafeAreaView>
  );
}
