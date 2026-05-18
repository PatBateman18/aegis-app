import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, Alert, Modal,
  Dimensions,
} from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient as SvgGradient, Stop, Line, Text as SvgText } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useDay } from '@/hooks/useDay';
import { AccentProvider, Card, SectionTitle, Inp, ToggleRow, ActionRow, ProgressBar } from '@/components/ui';
import { C } from '@/constants/colors';
import { ExercisePicker } from '@/components/ExercisePicker';
import ProgressPhotos from '@/components/ProgressPhotos';
// ─── Accent couleur page ─────────────────────────────────────────────────────
const ACC  = '#8E44AD';
const ACCB = '#A55CC0';
const ACCD = '#8E44AD33';
// ─────────────────────────────────────────────────────────────────────────────


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
          <Text style={{ fontFamily: 'Cinzel', fontSize: 16, color: ACCB, letterSpacing: 2 }}>{data.name}</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 16, gap: 24, borderBottomWidth: 1, borderBottomColor: C.s3 }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontFamily: 'SpaceMono', fontSize: 22, color: ACC }}>{totalEx}</Text>
            <Text style={{ fontSize: 10, color: C.dim, marginTop: 2, textTransform: 'uppercase', letterSpacing: 1 }}>exercices</Text>
          </View>
          <View style={{ width: 1, height: 30, backgroundColor: C.s3 }} />
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontFamily: 'SpaceMono', fontSize: 22, color: ACC }}>{totalSets}</Text>
            <Text style={{ fontSize: 10, color: C.dim, marginTop: 2, textTransform: 'uppercase', letterSpacing: 1 }}>séries</Text>
          </View>
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={120}>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
            {data.exercises.map((ex, ei) => (
              <View key={ei} style={{ backgroundColor: C.s2, borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: C.s3 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <TextInput
                    style={{ flex: 1, color: C.text, fontSize: 15, fontWeight: '600', borderBottomWidth: 1, borderBottomColor: ACCD, paddingBottom: 6 }}
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
                    <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: ACCD, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: ACC, fontSize: 12, fontWeight: '700' }}>{si + 1}</Text>
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
                style={{ flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: ACC, borderStyle: 'dashed', alignItems: 'center', gap: 6, backgroundColor: ACCD }}
                onPress={() => setShowPicker(true)}
              >
                <Text style={{ fontSize: 20 }}><Text style={{ fontSize: 11 }}>Rech.</Text></Text>
                <Text style={{ color: ACC, fontSize: 13, fontWeight: '600' }}>Chercher un exo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: ACC, borderStyle: 'dashed', alignItems: 'center', gap: 6 }}
                onPress={() => addExercise('')}
              >
                <Text style={{ fontSize: 13, color: C.dim }}>Edit</Text>
                <Text style={{ color: ACC, fontSize: 13, fontWeight: '600' }}>Écrire manuellement</Text>
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

// ─── Composant graphique poids ────────────────────────────────────────────────
const CHART_W = Dimensions.get('window').width - 64; // padding card
const CHART_H = 120;
const PAD = { top: 12, bottom: 28, left: 4, right: 4 };

type WeightPoint = { date: string; weight: number };

function WeightChart({ data }: { data: WeightPoint[] }) {
  if (data.length < 2) return null;

  const weights  = data.map(d => d.weight);
  const minW     = Math.min(...weights);
  const maxW     = Math.max(...weights);
  const range    = maxW - minW || 1;
  const first    = data[0];
  const last     = data[data.length - 1];
  const delta    = last.weight - first.weight;
  const isLoss   = delta < 0;

  // Calcul des coordonnées SVG
  const pts = data.map((d, i) => ({
    x: PAD.left + (i / (data.length - 1)) * (CHART_W - PAD.left - PAD.right),
    y: PAD.top + (1 - (d.weight - minW) / range) * (CHART_H - PAD.top - PAD.bottom),
    w: d.weight,
    date: d.date,
  }));

  // Ligne SVG (bezier smooth)
  let linePath = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const cpx  = (prev.x + curr.x) / 2;
    linePath += ` C ${cpx},${prev.y} ${cpx},${curr.y} ${curr.x},${curr.y}`;
  }

  // Zone remplie sous la courbe
  const fillPath = `${linePath} L ${pts[pts.length - 1].x},${CHART_H - PAD.bottom} L ${pts[0].x},${CHART_H - PAD.bottom} Z`;

  // Format date court
  const fmtDate = (d: string) => {
    const date = new Date(d);
    return `${date.getDate()}/${date.getMonth() + 1}`;
  };

  return (
    <View>
      {/* Résumé stats */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }}>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontFamily: 'SpaceMono', fontSize: 18, color: C.dim }}>{first.weight}</Text>
          <Text style={{ fontSize: 9, color: C.dim, marginTop: 2, letterSpacing: 1 }}>DÉPART</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{
            fontFamily: 'SpaceMono', fontSize: 22,
            color: delta === 0 ? C.dim : isLoss ? C.green : C.red,
          }}>
            {delta === 0 ? '—' : (delta > 0 ? '+' : '') + delta.toFixed(1) + ' kg'}
          </Text>
          <Text style={{ fontSize: 9, color: C.dim, marginTop: 2, letterSpacing: 1 }}>
            {delta === 0 ? 'STABLE' : isLoss ? '↓ PERTE' : '↑ PRISE'}
          </Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontFamily: 'SpaceMono', fontSize: 18, color: ACC }}>{last.weight}</Text>
          <Text style={{ fontSize: 9, color: C.dim, marginTop: 2, letterSpacing: 1 }}>ACTUEL</Text>
        </View>
      </View>

      {/* Courbe SVG */}
      <Svg width={CHART_W} height={CHART_H}>
        <Defs>
          <SvgGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={isLoss ? C.green : ACC} stopOpacity="0.25" />
            <Stop offset="1" stopColor={isLoss ? C.green : ACC} stopOpacity="0" />
          </SvgGradient>
        </Defs>

        {/* Ligne de base */}
        <Line
          x1={PAD.left} y1={CHART_H - PAD.bottom}
          x2={CHART_W - PAD.right} y2={CHART_H - PAD.bottom}
          stroke={C.s3} strokeWidth="1"
        />

        {/* Zone remplie */}
        <Path d={fillPath} fill="url(#wGrad)" />

        {/* Courbe */}
        <Path
          d={linePath}
          fill="none"
          stroke={isLoss ? C.green : ACC}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Points + labels aux extrémités */}
        {pts.map((p, i) => {
          const isFirst = i === 0;
          const isLast  = i === pts.length - 1;
          const showDot = isFirst || isLast || pts.length <= 10;
          return (
            <React.Fragment key={i}>
              {showDot && (
                <Circle
                  cx={p.x} cy={p.y} r={isFirst || isLast ? 4 : 2.5}
                  fill={isLoss ? C.green : ACC}
                  stroke={C.bg} strokeWidth="1.5"
                />
              )}
            </React.Fragment>
          );
        })}

        {/* Labels poids min/max sur l'axe Y */}
        <SvgText x={CHART_W - PAD.right} y={PAD.top + 4} fontSize="8" fill={C.dim} textAnchor="end">
          {maxW} kg
        </SvgText>
        <SvgText x={CHART_W - PAD.right} y={CHART_H - PAD.bottom - 4} fontSize="8" fill={C.dim} textAnchor="end">
          {minW} kg
        </SvgText>
      </Svg>

      {/* Dates début / fin */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
        <Text style={{ fontSize: 9, color: C.dim }}>{fmtDate(first.date)}</Text>
        {data.length > 4 && (
          <Text style={{ fontSize: 9, color: C.dim }}>
            {fmtDate(data[Math.floor(data.length / 2)].date)}
          </Text>
        )}
        <Text style={{ fontSize: 9, color: C.dim }}>{fmtDate(last.date)}</Text>
      </View>
    </View>
  );
}

export default function PhysicalScreen() {
  const { user, profile } = useAuth();
  const { day, history, updateDay } = useDay(user?.id);
  const [openSession, setOpenSession] = useState<Session | null>(null);
  const [weightText, setWeightText] = useState('');

  const calTarget = (profile as any)?.cal_target ?? 2300;
  const protTarget = (profile as any)?.prot_target ?? 180;
  const cal = day.calories ?? 0;
  const prot = day.protein ?? 0;
  const calColor = cal > calTarget ? C.red : ACC;
  const protColor = prot >= protTarget ? C.green : C.blue;

  const workoutData = parseWorkout(day.workout_type);
 const today = new Date().toISOString().split('T')[0];
const weightData = history
  .filter(d => d.weight && d.date !== today)
  .slice(0, 29)
  .reverse()
  .map(d => ({ date: d.date, weight: d.weight as number }));

// Ajoute le jour actuel en dernier avec la valeur fraîche de day
if (day.weight) {
  weightData.push({ date: today, weight: day.weight });
}
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
    <AccentProvider color={ACC}>
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>

        <View style={{ paddingBottom: 16, paddingTop: 8 }}>
          <Text style={{ fontSize: 10, color: C.dim, letterSpacing: 3, textTransform: 'uppercase' }}>Transformation physique</Text>
          <Text style={{ fontFamily: 'Cinzel', fontSize: 22, color: ACCB, marginTop: 4, letterSpacing: 4 }}>CORPS</Text>
        </View>

        <SectionTitle>Données du jour</SectionTitle>
        <Card>
          <View style={{ flexDirection: 'row' }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              {/* Champ poids avec buffer local pour accepter la virgule */}
              <View style={{ marginBottom: 14 }}>
                <Text style={{ fontSize: 10, color: C.dim, marginBottom: 6, letterSpacing: 2, textTransform: 'uppercase' }}>Poids</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <TextInput
                    style={{ flex: 1, backgroundColor: C.s2, borderWidth: 1, borderColor: C.s3, borderRadius: 8, padding: 12, color: C.text, fontSize: 15 }}
                    value={weightText || day.weight?.toString() || ''}
                    onChangeText={setWeightText}
                    onEndEditing={() => {
                      const normalized = weightText.replace(',', '.');
                      const parsed = parseFloat(normalized);
                      if (!isNaN(parsed)) updateDay({ weight: parsed });
                      setWeightText('');
                    }}
                    placeholder="—"
                    placeholderTextColor={C.dim}
                    keyboardType="decimal-pad"
                  />
                  <Text style={{ color: C.dim, fontSize: 12, minWidth: 30 }}>kg</Text>
                </View>
              </View>
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
          <ActionRow
            icon="⚔️"
            label="Séance réalisée"
            
            active={!!day.workout_done}
            onPress={v => updateDay({ workout_done: v })}
          />

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
                      <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: ACCD, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontFamily: "Cinzel", fontSize: 13, color: ACCD }}>+</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, color: C.text, fontWeight: '600' }}>{session.name}</Text>
                        <Text style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>
                          {exCount > 0 ? `${exCount} exercice${exCount > 1 ? 's' : ''} · ${setCount} séries` : 'Appuie pour ajouter des exercices'}
                        </Text>
                      </View>
                    </View>
                    <Text style={{ color: ACC, fontSize: 20 }}>›</Text>
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity
                style={{ padding: 14, borderRadius: 12, borderWidth: 1, borderColor: ACC, borderStyle: 'dashed', alignItems: 'center', backgroundColor: ACCD }}
                onPress={addSession}
              >
                <Text style={{ color: ACC, fontSize: 14, fontWeight: '600' }}>+ Nouvelle séance</Text>
              </TouchableOpacity>

              {workoutData.sessions.length > 0 && (
                <Text style={{ fontSize: 10, color: C.dim, textAlign: 'center', marginTop: 10 }}>Appui long pour supprimer une séance</Text>
              )}
            </View>
          )}
        </Card>

        {weightData.length > 1 ? (
          <>
            <SectionTitle>Évolution du poids</SectionTitle>
            <Card>
              <WeightChart data={weightData} />
            </Card>
          </>
        ) : (
          <>
            <SectionTitle>Évolution du poids</SectionTitle>
            <View style={{ backgroundColor: C.s1, borderWidth: 1, borderColor: C.s3, borderRadius: 14, padding: 20, alignItems: 'center', gap: 6, marginBottom: 14 }}>
              <Text style={{ fontFamily: "Cinzel", fontSize: 18, color: ACCD }}>✦</Text>
              <Text style={{ fontSize: 13, color: C.text, fontWeight: '600' }}>Courbe non disponible</Text>
              <Text style={{ fontSize: 11, color: C.dim, textAlign: 'center', lineHeight: 17 }}>
                Entre ton poids chaque jour pendant au moins 2 jours consécutifs pour voir ta progression.
              </Text>
            </View>
          </>
        )}

{user && <ProgressPhotos userId={user.id} />}

      </ScrollView>

      {openSession && (
        <SessionModal
          session={openSession}
          onClose={() => setOpenSession(null)}
          onUpdate={handleSessionUpdate}
        />
      )}
    </SafeAreaView>
    </AccentProvider>
  );
}
