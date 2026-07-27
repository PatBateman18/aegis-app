import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, Alert, Modal,
  Dimensions, Image, StyleSheet,
} from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient as SvgGradient, Stop, Line, Text as SvgText } from 'react-native-svg';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/hooks/useAuth';
import { useFocusEffect } from '@react-navigation/native';
import { useAmbientSound } from '@/hooks/useAmbientSound';
import { useDay } from '@/hooks/useDay';
import { AccentProvider, ActionRow } from '@/components/ui';
import { C } from '@/constants/colors';
import { ExercisePicker } from '@/components/ExercisePicker';
import ProgressPhotos from '@/components/ProgressPhotos';
import TransformationScreen from '@/components/TransformationScreen';
import { Animated, Easing } from 'react-native';

const { width, height } = Dimensions.get('window');
const ACC  = '#8E44AD';
const ACCB = '#A55CC0';
const ACCD = '#8E44AD33';

const HERO_IMG   = require('@/assets/hero/hero_corps.png');
const BG_SEANCE  = require('@/assets/hero/bg_seance.png');

// ─── Types ────────────────────────────────────────────────────────────────────
type Set = { weight: string; reps: string };
type Exercise = { name: string; sets: Set[] };
type Session = { id: string; name: string; exercises: Exercise[] };
type WorkoutData = { sessions: Session[]; activeId: string | null };

function parseWorkout(raw: string | undefined): WorkoutData {
  if (!raw) return { sessions: [], activeId: null };
  try { const p = JSON.parse(raw); if (p.sessions) return p; } catch {}
  return { sessions: [], activeId: null };
}
function uid() { return Math.random().toString(36).slice(2, 9); }

// ─── CircularProgress ─────────────────────────────────────────────────────────
function CircularProgress({ value, max, unit, label, icon, color = ACC, size = 80 }: {
  value: number; max: number; unit: string; label: string; icon: string; color?: string; size?: number;
}) {
  const r    = size / 2 - 7;
  const circ = 2 * Math.PI * r;
  const pct  = max > 0 ? Math.min(value / max, 1) : 0;
  const offset = circ * (1 - pct);
  const over = value > max;
  const displayColor = over ? C.red : color;

  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
          {/* Track */}
          <Circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={5} />
          {/* Progress */}
          <Circle
            cx={size/2} cy={size/2} r={r}
            fill="none" stroke={displayColor} strokeWidth={5}
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </Svg>
        {/* Center content */}
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 8, color: displayColor, marginBottom: 1 }}>{icon}</Text>
          <Text style={{ fontFamily: 'SpaceMono', fontSize: 16, color: C.text, fontWeight: '700', lineHeight: 18 }}>
            {value || '—'}
          </Text>
          <Text style={{ fontSize: 8, color: C.dim, lineHeight: 10 }}>/ {max}</Text>
        </View>
      </View>
      <Text style={{ fontSize: 9, color: displayColor, letterSpacing: 1, textTransform: 'uppercase', marginTop: 6, textAlign: 'center', fontWeight: '600' }}>{label}</Text>
      {/* Underline */}
      <View style={{ height: 1.5, width: 30, backgroundColor: displayColor, borderRadius: 1, marginTop: 4, opacity: 0.7 }} />
    </View>
  );
}

// ─── SessionModal ─────────────────────────────────────────────────────────────
function SessionModal({ session, onClose, onUpdate }: {
  session: Session; onClose: () => void; onUpdate: (s: Session) => void;
}) {
  const [data, setData] = useState<Session>(session);
  const [showPicker, setShowPicker] = useState(false);

  function save(updated: Session) { setData(updated); onUpdate(updated); }
  function addExercise(name: string) {
    save({ ...data, exercises: [...data.exercises, { name, sets: [{ weight: '', reps: '' }] }] });
  }
  function updateExName(i: number, name: string) {
    const exs = [...data.exercises]; exs[i] = { ...exs[i], name }; save({ ...data, exercises: exs });
  }
  function addSet(ei: number) {
    const exs = [...data.exercises];
    exs[ei] = { ...exs[ei], sets: [...exs[ei].sets, { weight: '', reps: '' }] };
    save({ ...data, exercises: exs });
  }
  function updateSet(ei: number, si: number, field: 'weight' | 'reps', val: string) {
    const exs = [...data.exercises]; const sets = [...exs[ei].sets];
    sets[si] = { ...sets[si], [field]: val }; exs[ei] = { ...exs[ei], sets };
    save({ ...data, exercises: exs });
  }
  function removeExercise(i: number) {
    Alert.alert('Supprimer ?', data.exercises[i].name || 'Cet exercice', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => {
        const exs = [...data.exercises]; exs.splice(i, 1); save({ ...data, exercises: exs });
      }},
    ]);
  }
  function removeSet(ei: number, si: number) {
    const exs = [...data.exercises]; const sets = [...exs[ei].sets];
    sets.splice(si, 1); exs[ei] = { ...exs[ei], sets }; save({ ...data, exercises: exs });
  }
  const totalSets = data.exercises.reduce((acc, ex) => acc + ex.sets.filter(s => s.weight || s.reps).length, 0);
  const totalEx   = data.exercises.filter(ex => ex.name).length;

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: C.s3 }}>
          <TouchableOpacity onPress={onClose}><Text style={{ color: C.dim, fontSize: 14 }}>Fermer</Text></TouchableOpacity>
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
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 16 }} keyboardShouldPersistTaps="handled">
            {data.exercises.map((ex, ei) => (
              <View key={ei} style={{ backgroundColor: C.s2, borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: C.s3 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  {/* Contrôlé : value + onChangeText pour sauvegarde immédiate */}
                  <TextInput
                    style={{ flex: 1, color: C.text, fontSize: 15, fontWeight: '600', borderBottomWidth: 1, borderBottomColor: ACCD, paddingBottom: 6 }}
                    value={ex.name}
                    onChangeText={name => updateExName(ei, name)}
                    placeholder="Nom de l'exercice..." placeholderTextColor={C.dim}
                    autoCorrect={false} spellCheck={false}
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
                      value={set.weight} onChangeText={v => updateSet(ei, si, 'weight', v)}
                      placeholder="—" placeholderTextColor={C.dim} keyboardType="numeric"
                    />
                    <TextInput
                      style={{ flex: 1, backgroundColor: C.s1, borderWidth: 1, borderColor: C.s3, borderRadius: 8, padding: 8, color: C.text, fontSize: 14, textAlign: 'center' }}
                      value={set.reps} onChangeText={v => updateSet(ei, si, 'reps', v)}
                      placeholder="—" placeholderTextColor={C.dim} keyboardType="numeric"
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
                <Text style={{ color: ACC, fontSize: 13, fontWeight: '600' }}>Chercher un exo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: ACC, borderStyle: 'dashed', alignItems: 'center', gap: 6 }}
                onPress={() => addExercise('')}
              >
                <Text style={{ color: ACC, fontSize: 13, fontWeight: '600' }}>Écrire manuellement</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
      {showPicker && (
        <ExercisePicker onSelect={(name) => { addExercise(name); setShowPicker(false); }} onClose={() => setShowPicker(false)} />
      )}
    </Modal>
  );
}

// ─── WeightChart (nouveau) ────────────────────────────────────────────────────
const CHART_W = width - 64;
const CHART_H = 140;

type WPt = { date: string; weight: number };

// ─── AnimatedCircle ─────────────────────────────────────────────────────────
const AnimatedCircleSvg = Animated.createAnimatedComponent(Circle);

function AnimatedCircle({ icon, value, max, color, label, unit, onChange, keyboardType = 'numeric' }: {
  icon: any; value: number; max: number; color: string;
  label: string; unit: string; onChange: (v: string) => void; keyboardType?: string;
}) {
  const SIZE = 88; const R = 36; const CIRC = 2 * Math.PI * R;
  const animVal = useRef(new Animated.Value(0)).current;
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const [localText, setLocalText] = useState(value > 0 ? String(value) : '');

  useEffect(() => { setLocalText(value > 0 ? String(value) : ''); }, [value]);

  useEffect(() => {
    Animated.timing(animVal, { toValue: pct, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [pct]);

  const dashOffset = animVal.interpolate({ inputRange: [0, 1], outputRange: [CIRC, 0] });

  return (
    <View style={{ alignItems: 'center', width: SIZE + 8 }}>
      <Image source={icon} style={{ width: 52, height: 52, marginBottom: 4 }} resizeMode="contain" />
      <View style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={SIZE} height={SIZE} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
          <Circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={5.5} />
          <AnimatedCircleSvg cx={SIZE/2} cy={SIZE/2} r={R} fill="none" stroke={color} strokeWidth={5.5}
            strokeDasharray={CIRC} strokeDashoffset={dashOffset} strokeLinecap="round" />
        </Svg>
        <TextInput
          style={{ fontFamily: 'SpaceMono', fontSize: 20, color: C.text, fontWeight: '700', padding: 0, textAlign: 'center', minWidth: 40 }}
          value={localText}
          onChangeText={setLocalText}
          onEndEditing={() => { onChange(localText); }}
          placeholder="0" placeholderTextColor="rgba(255,255,255,0.25)"
          keyboardType={keyboardType as any} returnKeyType="done"
        />
      </View>
      <Text style={{ fontSize: 9, color: C.dim, marginTop: 4 }}>/ {max}{unit ? ` ${unit}` : ''}</Text>
      <Text style={{ fontSize: 8, color, letterSpacing: 1, textTransform: 'uppercase', marginTop: 4, fontWeight: '700', textAlign: 'center' }}>{label}</Text>
      <View style={{ height: 1.5, width: 28, backgroundColor: color, borderRadius: 1, marginTop: 3, opacity: 0.7 }} />
    </View>
  );
}

function WeightEvolution({ data, day, updateDay, weightText, setWeightText }: {
  data: WPt[]; day: any; updateDay: (u: any) => void;
  weightText: string; setWeightText: (v: string) => void;
}) {
  const hasData = data.length >= 2;
  const last    = data[data.length - 1];
  const first   = data[0];

  // Deltas
  const weekAgo  = [...data].reverse().find(d => {
    const diff = (new Date(last?.date ?? '').getTime() - new Date(d.date).getTime()) / 86400000;
    return diff >= 6;
  }) ?? first;
  const monthAgo = [...data].reverse().find(d => {
    const diff = (new Date(last?.date ?? '').getTime() - new Date(d.date).getTime()) / 86400000;
    return diff >= 28;
  }) ?? first;

  const deltaWeek  = hasData ? +(last.weight - weekAgo.weight).toFixed(1)  : 0;
  const deltaMonth = hasData ? +(last.weight - monthAgo.weight).toFixed(1) : 0;

  // SVG courbe
  const buildPath = () => {
    if (data.length < 2) return { line: '', fill: '' };
    const weights = data.map(d => d.weight);
    const minW = Math.min(...weights) - 1;
    const maxW = Math.max(...weights) + 1;
    const range = maxW - minW || 1;
    const PAD = { l: 8, r: 8, t: 12, b: 28 };
    const pts = data.map((d, i) => ({
      x: PAD.l + (i / (data.length - 1)) * (CHART_W - PAD.l - PAD.r),
      y: PAD.t + (1 - (d.weight - minW) / range) * (CHART_H - PAD.t - PAD.b),
    }));
    let line = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const p = pts[i-1], c = pts[i], cpx = (p.x + c.x) / 2;
      line += ` C ${cpx},${p.y} ${cpx},${c.y} ${c.x},${c.y}`;
    }
    const fill = `${line} L ${pts[pts.length-1].x},${CHART_H - PAD.b} L ${pts[0].x},${CHART_H - PAD.b} Z`;
    return { line, fill, pts, minW, maxW, range, PAD };
  };
  const chart = hasData ? buildPath() : null;

  const fmtD = (d: string) => {
    const dt = new Date(d + 'T12:00:00');
    return `${dt.getDate()}/${dt.getMonth() + 1}`;
  };

  return (
    <View style={{ backgroundColor: '#080612', borderRadius: 20, borderWidth: 1, borderColor: ACC + '44', padding: 20 }}>

      {/* Saisie poids */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <View>
          <Text style={{ fontSize: 9, color: C.dim, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>POIDS DU JOUR</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
            <TextInput
              style={{ fontFamily: 'SpaceMono', fontSize: 36, color: ACCB, fontWeight: '700', padding: 0, minWidth: 60 }}
              value={weightText || (day.weight ? String(day.weight) : '')}
              onFocus={() => setWeightText(day.weight?.toString() ?? '')}
              onChangeText={setWeightText}
              onEndEditing={() => {
                if (!weightText) { updateDay({ weight: undefined }); }
                else { const p = parseFloat(weightText.replace(',', '.')); if (!isNaN(p)) updateDay({ weight: p }); }
                setWeightText('');
              }}
              placeholder="—"
              placeholderTextColor={ACC + '55'}
              keyboardType="decimal-pad"
              returnKeyType="done"
            />
            <Text style={{ fontSize: 16, color: C.dim, marginBottom: 4 }}>kg</Text>
          </View>
          <Text style={{ fontSize: 9, color: C.dim, letterSpacing: 1, marginTop: 2 }}>POIDS ACTUEL</Text>
        </View>

        {/* Deltas */}
        <View style={{ gap: 12, alignItems: 'flex-end' }}>
          <View style={{ alignItems: 'flex-end' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ fontFamily: 'SpaceMono', fontSize: 18, color: deltaWeek === 0 ? C.dim : deltaWeek < 0 ? C.green : C.red, fontWeight: '700' }}>
                {deltaWeek === 0 ? '—' : (deltaWeek > 0 ? '+' : '') + deltaWeek + ' kg'}
              </Text>
              {deltaWeek !== 0 && <Text style={{ fontSize: 14, color: deltaWeek < 0 ? C.green : C.red }}>{deltaWeek < 0 ? '↓' : '↑'}</Text>}
            </View>
            <Text style={{ fontSize: 8, color: C.dim, letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 }}>CETTE SEMAINE</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ fontFamily: 'SpaceMono', fontSize: 18, color: deltaMonth === 0 ? C.dim : deltaMonth < 0 ? C.green : C.red, fontWeight: '700' }}>
                {deltaMonth === 0 ? '—' : (deltaMonth > 0 ? '+' : '') + deltaMonth + ' kg'}
              </Text>
              {deltaMonth !== 0 && <Text style={{ fontSize: 14, color: deltaMonth < 0 ? C.green : C.red }}>{deltaMonth < 0 ? '↓' : '↑'}</Text>}
            </View>
            <Text style={{ fontSize: 8, color: C.dim, letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 }}>CE MOIS</Text>
          </View>
        </View>
      </View>

      {/* Graphe SVG */}
      {hasData && chart && (chart as any).pts ? (
        <View>
          <Svg width={CHART_W} height={CHART_H}>
            <Defs>
              <SvgGradient id="wg" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0"   stopColor={ACC} stopOpacity="0.4" />
                <Stop offset="0.7" stopColor={ACC} stopOpacity="0.08" />
                <Stop offset="1"   stopColor={ACC} stopOpacity="0" />
              </SvgGradient>
            </Defs>
            {/* Ligne de base */}
            <Line x1={(chart as any).PAD.l} y1={CHART_H - (chart as any).PAD.b} x2={CHART_W - (chart as any).PAD.r} y2={CHART_H - (chart as any).PAD.b} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
            {/* Fill */}
            <Path d={(chart as any).fill} fill="url(#wg)" />
            {/* Courbe */}
            <Path d={(chart as any).line} fill="none" stroke={ACCB} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {/* Points */}
            {(chart as any).pts.map((p: any, i: number) => {
              const isFirst = i === 0, isLast = i === (chart as any).pts.length - 1;
              return (isFirst || isLast || data.length <= 10) ? (
                <Circle key={i} cx={p.x} cy={p.y} r={isFirst || isLast ? 5 : 3} fill={ACCB} stroke="#080612" strokeWidth="2" />
              ) : null;
            })}
            {/* Valeur max */}
            <SvgText x={CHART_W - (chart as any).PAD.r} y={(chart as any).PAD.t + 4} fontSize="9" fill={C.dim} textAnchor="end">{(chart as any).maxW.toFixed(1)}</SvgText>
          </Svg>
          {/* Dates */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
            <Text style={{ fontSize: 9, color: C.dim }}>{fmtD(data[0].date)}</Text>
            {data.length > 4 && <Text style={{ fontSize: 9, color: C.dim }}>{fmtD(data[Math.floor(data.length / 2)].date)}</Text>}
            <Text style={{ fontSize: 9, color: C.dim }}>{fmtD(data[data.length - 1].date)}</Text>
          </View>
        </View>
      ) : (
        <View style={{ alignItems: 'center', paddingVertical: 20, gap: 8 }}>
          <Text style={{ fontSize: 28, color: ACC + '44' }}>◈</Text>
          <Text style={{ fontSize: 13, color: C.dim, textAlign: 'center', lineHeight: 20 }}>
            Entre ton poids chaque jour{'\n'}pour voir ta courbe apparaître.
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function PhysicalScreen() {
  const { user, profile } = useAuth();
  const { playAmbient } = useAmbientSound();

  useFocusEffect(useCallback(() => {
    playAmbient('corps');
  }, []));
  const { day, history, updateDay } = useDay(user?.id);
  const [openSession, setOpenSession] = useState<Session | null>(null);
  const [weightText, setWeightText] = useState('');
  const [showTransformation, setShowTransformation] = useState(false);
  const heroScale = useRef(new Animated.Value(1)).current;
  const insets = useSafeAreaInsets();

  const calTarget  = (profile as any)?.cal_target  ?? 2300;
  const protTarget = (profile as any)?.prot_target ?? 180;
  const cal   = day.calories ?? 0;
  const prot  = day.protein  ?? 0;

  const [workoutData, setWorkoutDataState] = useState<WorkoutData>(() => parseWorkout(day.workout_type));
  const lastSyncedWorkoutJson = useRef<string | undefined>(day.workout_type);
  const workoutSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Resynchronise depuis le serveur seulement si le contenu a changé ailleurs
  // (nouveau jour chargé, reload...) — jamais pendant qu'on est en train d'écrire,
  // sinon une requête qui revient en retard écrase l'édition en cours.
  useEffect(() => {
    if (day.workout_type !== lastSyncedWorkoutJson.current) {
      setWorkoutDataState(parseWorkout(day.workout_type));
      lastSyncedWorkoutJson.current = day.workout_type;
    }
  }, [day.workout_type]);

  const today = new Date().toISOString().split('T')[0];
  const weightData = history
    .filter(d => d.weight && d.date !== today)
    .slice(0, 29).reverse()
    .map(d => ({ date: d.date, weight: d.weight as number }));
  if (day.weight) weightData.push({ date: today, weight: day.weight });

  // Stagger
  const stagger = useRef([0,1,2,3,4].map(() => new Animated.Value(0))).current;
  useEffect(() => {
    setTimeout(() => {
      Animated.stagger(80, stagger.map(a =>
        Animated.spring(a, { toValue: 1, tension: 50, friction: 12, useNativeDriver: true })
      )).start();
    }, 150);
  }, []);
  const S = (i: number) => ({
    opacity: stagger[i],
    transform: [{ translateY: stagger[i].interpolate({ inputRange: [0,1], outputRange: [20, 0] }) }],
  });

  // Hero breathing
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(heroScale, { toValue: 1.03, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(heroScale, { toValue: 1,    duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);

  function saveWorkout(data: WorkoutData) {
    setWorkoutDataState(data); // instantané, aucun aller-retour réseau ici

    const json = JSON.stringify(data);
    if (workoutSaveTimer.current) clearTimeout(workoutSaveTimer.current);
    workoutSaveTimer.current = setTimeout(() => {
      lastSyncedWorkoutJson.current = json;
      updateDay({ workout_type: json });
      workoutSaveTimer.current = null;
    }, 500);
  }
  function addSession() {
    Alert.prompt('Nouvelle séance', 'Nom de la séance', (name) => {
      if (!name?.trim()) return;
      const s: Session = { id: uid(), name: name.trim(), exercises: [] };
      saveWorkout({ sessions: [...workoutData.sessions, s], activeId: s.id });
      setOpenSession(s);
    }, 'plain-text', '');
  }
  function deleteSession(id: string) {
    Alert.alert('Supprimer ?', '', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => saveWorkout({ sessions: workoutData.sessions.filter(s => s.id !== id), activeId: null }) },
    ]);
  }
  function handleSessionUpdate(updated: Session) {
    saveWorkout({ ...workoutData, sessions: workoutData.sessions.map(s => s.id === updated.id ? updated : s) });
  }

  return (
    <AccentProvider color={ACC}>
      <View style={{ flex: 1, backgroundColor: '#080612' }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }} keyboardShouldPersistTaps="handled">

        {/* ── HERO ── */}
        <View style={{ height: height * 0.52, position: 'relative', overflow: 'hidden' }}>
          <Animated.Image
            source={HERO_IMG}
            style={{ width: '100%', height: '100%', transform: [{ scale: heroScale }] }}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(8,6,18,0.4)', 'rgba(8,6,18,0.9)', '#080612']}
            locations={[0.2, 0.5, 0.8, 1]}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Label page */}
          <View style={{ position: 'absolute', top: insets.top + 12, left: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Text style={{ color: ACC, fontSize: 10 }}>◆</Text>
              <Text style={{ fontSize: 10, color: ACC, letterSpacing: 3, textTransform: 'uppercase', fontWeight: '700' }}>Discipline physique</Text>
            </View>
          </View>

          {/* Titre bas */}
          <View style={{ position: 'absolute', bottom: 28, left: 20, right: 20 }}>
            <Text style={{ fontFamily: 'Cinzel', fontSize: 42, color: C.text, fontWeight: '800', letterSpacing: 2, lineHeight: 46 }}>CORPS</Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, textTransform: 'uppercase', marginTop: 6 }}>
              FORGE TON PHYSIQUE.  MAÎTRISE TON CORPS.
            </Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: 16 }}>


          {/* ── APERÇU DU JOUR — cercles ── */}
          <Animated.View style={[S(1), {
            backgroundColor: '#080612',
            borderRadius: 20, borderWidth: 1, borderColor: ACC + '33',
            padding: 20, marginBottom: 14,
          }]}>
            <Text style={{ fontSize: 11, color: ACC, letterSpacing: 3, textTransform: 'uppercase', fontWeight: '700', marginBottom: 10 }}>APERÇU DU JOUR</Text>

            <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 8 }}>
              <AnimatedCircle icon={require('@/assets/ui/icone_corps_proteines.png')} value={day.protein ?? 0}    max={protTarget} color={prot >= protTarget ? C.green : ACC} label="PROTÉINES (g)" unit="g" onChange={v => updateDay({ protein: parseInt(v) || undefined })}  keyboardType="numeric" />
              <AnimatedCircle icon={require('@/assets/ui/icone_corps_cardio.png')}    value={day.cardio_min ?? 0} max={60}         color={C.blue}                        label="ENTRAÎNEMENT (min)"  unit="min" onChange={v => updateDay({ cardio_min: parseInt(v) || undefined })} keyboardType="numeric" />
              <AnimatedCircle icon={require('@/assets/ui/icone_corps_poids.png')}     value={day.weight ?? 0}     max={200}        color={ACCB}                          label="POIDS (kg)"    unit="kg"  onChange={v => { const p = parseFloat(v.replace(',','.')); if (!isNaN(p)) updateDay({ weight: p }); }} keyboardType="decimal-pad" />
            </View>
          </Animated.View>

          {/* ── SÉANCE D'ENTRAÎNEMENT ── */}
          <Animated.View style={[S(2), { marginBottom: 14 }]}>
            <View style={{ borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: ACC + '33' }}>
              <Image source={BG_SEANCE} style={{ position: 'absolute', width: '100%', height: '100%' }} resizeMode="cover" />
              <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(8,6,18,0.82)' }} />
              <View style={{ padding: 18 }}>
                <Text style={{ fontSize: 11, color: ACC, letterSpacing: 3, textTransform: 'uppercase', fontWeight: '700', marginBottom: 14 }}>
                  SÉANCE D'ENTRAÎNEMENT
                </Text>
                {/* Checkbox séance */}
                <TouchableOpacity
                  onPress={() => updateDay({ workout_done: !day.workout_done })}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 14,
                    backgroundColor: day.workout_done ? ACC + '18' : 'rgba(255,255,255,0.04)',
                    borderRadius: 14, padding: 14, marginBottom: 12,
                    borderWidth: 1.5, borderColor: day.workout_done ? ACC + '66' : 'rgba(255,255,255,0.08)',
                  }}
                >
                  {/* Thumbnail image gym */}
                  <View style={{ width: 52, height: 52, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: ACC + '44' }}>
                    <Image source={BG_SEANCE} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' }}>
                      {day.workout_done && (
                        <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: ACC, alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ color: '#000', fontSize: 12, fontWeight: '800' }}>✓</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, color: day.workout_done ? C.text : C.dim, fontWeight: '600' }}>Séance réalisée</Text>
                    <Text style={{ fontSize: 11, color: day.workout_done ? ACC : C.dim, marginTop: 2 }}>
                      {day.workout_done ? 'TERMINÉE' : 'En attente'}
                    </Text>
                  </View>
                  <View style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: day.workout_done ? ACC : 'rgba(255,255,255,0.2)', backgroundColor: day.workout_done ? ACC + '22' : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                    {day.workout_done && <Text style={{ color: ACC, fontSize: 13, fontWeight: '800' }}>✓</Text>}
                  </View>
                </TouchableOpacity>

                {/* Sessions listées */}
                {day.workout_done && (
                  <View style={{ gap: 8 }}>
                    {workoutData.sessions.map(session => {
                      const exCount  = session.exercises.filter(e => e.name).length;
                      const setCount = session.exercises.reduce((a, e) => a + e.sets.filter(s => s.weight || s.reps).length, 0);
                      const topExos  = session.exercises.filter(e => e.name).slice(0, 3);
                      return (
                        <TouchableOpacity key={session.id}
                          style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: ACC + '33' }}
                          onPress={() => setOpenSession(session)}
                          onLongPress={() => deleteSession(session.id)}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 }}>
                            <View style={{ width: 42, height: 42, borderRadius: 10, backgroundColor: ACCD, borderWidth: 1, borderColor: ACC + '55', alignItems: 'center', justifyContent: 'center' }}>
                              <Text style={{ fontFamily: 'Cinzel', fontSize: 16, color: ACCB, fontWeight: '700' }}>{(session.name || '?').charAt(0).toUpperCase()}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Text style={{ fontSize: 15, color: C.text, fontWeight: '600' }}>{session.name}</Text>
                                <View style={{ backgroundColor: ACC + '22', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, borderColor: ACC + '44' }}>
                                  <Text style={{ fontSize: 8, color: ACC, fontWeight: '700', letterSpacing: 1 }}>TERMINÉE</Text>
                                </View>
                              </View>
                              {topExos.length > 0 && (
                                <View style={{ marginTop: 8, gap: 4 }}>
                                  {topExos.map((ex, i) => {
                                    const sets = ex.sets.filter(s => s.weight || s.reps);
                                    return (
                                      <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: ACC + '22', borderWidth: 1, borderColor: ACC + '55', alignItems: 'center', justifyContent: 'center' }}>
                                          <Text style={{ color: ACC, fontSize: 8, fontWeight: '800' }}>✓</Text>
                                        </View>
                                        <Text style={{ fontSize: 12, color: C.dim, flex: 1 }}>{ex.name}</Text>
                                        {sets.length > 0 && <Text style={{ fontSize: 11, color: C.dim, fontFamily: 'SpaceMono' }}>{sets.length} x {sets[0].reps || '—'}</Text>}
                                      </View>
                                    );
                                  })}
                                  {exCount > 3 && <Text style={{ fontSize: 10, color: C.dim, marginTop: 2 }}>+ {exCount - 3} exercice{exCount - 3 > 1 ? 's' : ''}</Text>}
                                </View>
                              )}
                            </View>
                            <Text style={{ color: ACC, fontSize: 20 }}>›</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                    <TouchableOpacity
                      style={{ padding: 14, borderRadius: 14, borderWidth: 1, borderColor: ACC, borderStyle: 'dashed', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, backgroundColor: ACCD }}
                      onPress={addSession}
                    >
                      <Text style={{ color: ACC, fontSize: 14, fontWeight: '600', letterSpacing: 1 }}>VOIR MES SÉANCES</Text>
                      <Text style={{ color: ACC, fontSize: 18 }}>›</Text>
                    </TouchableOpacity>
                    {workoutData.sessions.length > 0 && (
                      <Text style={{ fontSize: 10, color: C.dim, textAlign: 'center' }}>Appui long pour supprimer</Text>
                    )}
                  </View>
                )}
              </View>
            </View>
          </Animated.View>

          {/* ── ÉVOLUTION CORPORELLE ── */}
          <Animated.View style={[S(3), { marginBottom: 14 }]}>
            <Text style={{ fontSize: 11, color: ACC, letterSpacing: 3, textTransform: 'uppercase', fontWeight: '700', marginBottom: 14 }}>ÉVOLUTION CORPORELLE</Text>
            <WeightEvolution
              data={weightData}
              day={day}
              updateDay={updateDay}
              weightText={weightText}
              setWeightText={setWeightText}
            />
          </Animated.View>

          {/* ── PHOTOS ── */}
          <Animated.View style={S(4)}>
            <TouchableOpacity onPress={() => setShowTransformation(true)} activeOpacity={0.88}>
              <View style={{ borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: ACC + '44', marginBottom: 14, height: 100 }}>
                <Image
                  source={require('@/assets/hero/hero_transformation.png')}
                  style={{ position: 'absolute', width: '100%', height: 320, top: -20 }}
                  resizeMode="cover"
                />
                <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(8,6,18,0.78)' }} />
                <View style={{ padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 9, color: ACC, letterSpacing: 3, textTransform: 'uppercase', fontWeight: '700', marginBottom: 4 }}>TRANSFORMATION</Text>
                    <Text style={{ fontSize: 16, color: C.text, fontWeight: '700' }}>Mes photos de progression</Text>
                    <Text style={{ fontSize: 12, color: ACCB, marginTop: 4, fontStyle: 'italic' }}>Reste constant. Deviens légendaire.</Text>
                  </View>
                  <Text style={{ color: ACC, fontSize: 22 }}>›</Text>
                </View>
              </View>
            </TouchableOpacity>
            {user && <TransformationScreen visible={showTransformation} onClose={() => setShowTransformation(false)} userId={user.id} />}
          </Animated.View>

        </View>
      </ScrollView>

      {openSession && (
        <SessionModal session={openSession} onClose={() => setOpenSession(null)} onUpdate={handleSessionUpdate} />
      )}
      </View>
    </AccentProvider>
  );
}
