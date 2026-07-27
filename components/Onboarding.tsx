// components/Onboarding.tsx
// Onboarding AEGIS v2 — Narration KRIOS + Quiz personnalisé
import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Dimensions, TextInput, Animated, KeyboardAvoidingView,
  Platform, PanResponder, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { C } from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import { useNarration, VOICE_IDS } from '@/hooks/useNarration';
import { saveGender } from '@/hooks/useGender';

const { width, height } = Dimensions.get('window');
const GOLD  = '#C9A84C';
const GOLDB = '#E8C46A';
const KRIOS_IMG   = require('@/assets/krios.png');
const ASPASIA_IMG = require('@/assets/aspasia.png');

// ─── Formule Mifflin-St Jeor ─────────────────────────────────────────────────
function calcNutrition(age: number, poids: number, taille: number, sexe: string, activite: string, objectif: string) {
  const bmr = sexe === 'homme'
    ? 10 * poids + 6.25 * taille - 5 * age + 5
    : 10 * poids + 6.25 * taille - 5 * age - 161;

  const actCoef: Record<string, number> = {
    sedentaire: 1.2, leger: 1.375, actif: 1.55, tres_actif: 1.725,
  };
  const tdee = bmr * (actCoef[activite] ?? 1.375);

  let calories: number;
  let proteines: number;
  let rythme: string;

  if (objectif === 'perte') {
    calories = Math.round(tdee - 400);
    // 1.8g/kg plafonné à 175g — réaliste pour la perte
    proteines = Math.min(175, Math.round(poids * 1.8));
    rythme = '~0.5 kg / semaine';
  } else if (objectif === 'muscle') {
    calories = Math.round(tdee + 250);
    // 1.8g/kg pour la prise de muscle — suffisant
    proteines = Math.min(200, Math.round(poids * 1.8));
    rythme = '+0.25 kg / semaine';
  } else {
    calories = Math.round(tdee);
    proteines = Math.min(160, Math.round(poids * 1.6));
    rythme = 'Maintien du poids';
  }

  return { calories, proteines, tdee: Math.round(tdee), rythme };
}

// ─── Particules ───────────────────────────────────────────────────────────────
function Particles() {
  const particles = useRef(
    Array.from({ length: 14 }, (_, i) => ({
      id: i, x: 15 + Math.random() * (width - 30),
      delay: i * 600 + Math.random() * 800,
      dur: 6000 + Math.random() * 4000,
      anim: new Animated.Value(height + 10),
      op: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    particles.forEach(p => {
      const loop = () => {
        p.anim.setValue(height + 10); p.op.setValue(0);
        Animated.sequence([
          Animated.delay(p.delay),
          Animated.parallel([
            Animated.timing(p.anim, { toValue: -20, duration: p.dur, useNativeDriver: true }),
            Animated.sequence([
              Animated.timing(p.op, { toValue: 0.5, duration: 700, useNativeDriver: true }),
              Animated.timing(p.op, { toValue: 0.5, duration: p.dur - 1400, useNativeDriver: true }),
              Animated.timing(p.op, { toValue: 0, duration: 700, useNativeDriver: true }),
            ]),
          ]),
        ]).start(loop);
      };
      loop();
    });
  }, []);

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {particles.map(p => (
        <Animated.View key={p.id} style={{
          position: 'absolute', left: p.x,
          width: 2.5, height: 2.5, borderRadius: 1.5,
          backgroundColor: GOLDB, opacity: p.op,
          transform: [{ translateY: p.anim }],
        }} />
      ))}
    </View>
  );
}

// ─── Typewriter ───────────────────────────────────────────────────────────────
function TypewriterText({ text, style, onDone }: { text: string; style?: any; onDone?: () => void }) {
  const [displayed, setDisplayed] = useState('');
  const idx = useRef(0);
  const timer = useRef<any>(null);

  useEffect(() => {
    setDisplayed(''); idx.current = 0;
    const type = () => {
      if (idx.current < text.length) {
        idx.current++;
        setDisplayed(text.slice(0, idx.current));
        const ch = text[idx.current - 1];
        // Pauses naturelles selon ponctuation
        const delay = ch === '.' || ch === '?' || ch === '!' ? 120
          : ch === ',' || ch === ';' || ch === '…' ? 70
          : ch === ' ' ? 18
          : 22 + Math.random() * 10; // légère variation pour effet naturel
        timer.current = setTimeout(type, delay);
      } else onDone?.();
    };
    // Petit délai initial pour laisser la bulle apparaître
    // Délai plus long sur la première scène pour laisser KRIOS apparaître
    const initialDelay = idx.current === 0 ? 900 : 200;
    timer.current = setTimeout(type, initialDelay);
    return () => clearTimeout(timer.current);
  }, [text]);

  return <Text style={style}>{displayed}</Text>;
}

// ─── Bulle KRIOS ──────────────────────────────────────────────────────────────
function KriosBubble({ text, onDone, narrator }: { text: string; onDone: () => void; narrator?: string }) {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(-10)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade,  { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(slide, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
    ]).start();
  }, [text]);
  return (
    <Animated.View style={[s.bubble, { opacity: fade, transform: [{ translateY: slide }] }]}>
      {narrator && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: GOLD }} />
          <Text style={{ fontFamily: 'Cinzel', fontSize: 9, color: GOLD, letterSpacing: 3 }}>{narrator}</Text>
        </View>
      )}
      <TypewriterText text={text} style={s.bubbleText} onDone={onDone} />
    </Animated.View>
  );
}

// ─── Slider élégant ───────────────────────────────────────────────────────────
function ElegantSlider({ value, min, max, step = 1, unit, onChange }: {
  value: number; min: number; max: number; step?: number; unit: string; onChange: (v: number) => void;
}) {
  const TRACK_W = width - 80;
  const progress = (value - min) / (max - min);
  const thumbX = useRef(new Animated.Value(progress * TRACK_W)).current;
  const [isDragging, setIsDragging] = useState(false);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => setIsDragging(true),
    onPanResponderMove: (_, gs) => {
      const rawX = Math.max(0, Math.min(TRACK_W, gs.moveX - 40));
      const rawVal = min + (rawX / TRACK_W) * (max - min);
      const snapped = Math.round(rawVal / step) * step;
      onChange(Math.max(min, Math.min(max, snapped)));
      thumbX.setValue(rawX);
    },
    onPanResponderRelease: () => setIsDragging(false),
  });

  const fillW = progress * TRACK_W;

  return (
    <View style={{ alignItems: 'center', paddingVertical: 20 }}>
      {/* Valeur */}
      <View style={[s.sliderValue, isDragging && { borderColor: GOLD }]}>
        <Text style={{ fontFamily: 'Cinzel', fontSize: 28, color: GOLDB, fontWeight: '700' }}>
          {value}
        </Text>
        <Text style={{ fontSize: 14, color: GOLD, marginTop: 2 }}>{unit}</Text>
      </View>
      {/* Track */}
      <View style={{ width: TRACK_W, height: 4, backgroundColor: '#1a1a1a', borderRadius: 2, marginTop: 20 }}>
        <View style={{ width: fillW, height: 4, backgroundColor: GOLD, borderRadius: 2 }} />
        <Animated.View
          {...panResponder.panHandlers}
          style={{
            position: 'absolute', top: -12,
            left: fillW - 14,
            width: 28, height: 28, borderRadius: 14,
            backgroundColor: GOLDB,
            borderWidth: 2, borderColor: '#000',
            shadowColor: GOLD, shadowOpacity: 0.6, shadowRadius: 8,
          }}
        />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: TRACK_W, marginTop: 8 }}>
        <Text style={{ fontSize: 10, color: C.dim }}>{min} {unit}</Text>
        <Text style={{ fontSize: 10, color: C.dim }}>{max} {unit}</Text>
      </View>
    </View>
  );
}

// ─── Chip sélectionnable ──────────────────────────────────────────────────────
function Chip({ label, sub, emoji, selected, onPress, color = GOLD }: {
  label: string; sub?: string; emoji?: string; selected: boolean;
  onPress: () => void; color?: string;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  function press() {
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.94, tension: 300, friction: 8, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1,    tension: 200, friction: 8, useNativeDriver: true }),
    ]).start();
    onPress();
  }
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={press} activeOpacity={1}
        style={[s.chip, selected && { backgroundColor: color + '22', borderColor: color }]}
      >
        {emoji && <Text style={{ fontSize: 18, marginBottom: 4 }}>{emoji}</Text>}
        <Text style={[s.chipLabel, selected && { color }]}>{label}</Text>
        {sub && <Text style={[s.chipSub, selected && { color: color + 'AA' }]}>{sub}</Text>}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Résumé final cinématique ─────────────────────────────────────────────────
const OBJECTIF_LABELS: Record<string, { label: string; icon: string }> = {
  perte_poids:    { label: 'Perdre du poids',        icon: '🔥' },
  muscle:         { label: 'Construire du muscle',   icon: '💪' },
  transformation: { label: 'Transformation complète',icon: '⚔' },
  discipline:     { label: 'Discipline & routine',   icon: '🧠' },
  confiance:      { label: 'Reprendre confiance',    icon: '✨' },
  optimiser:      { label: 'Optimiser mon physique', icon: '🎯' },
};

const HABITUDE_LABELS: Record<string, { label: string; icon: string }> = {
  sport:       { label: 'Séances',      icon: '🏋️' },
  sommeil:     { label: 'Sommeil',      icon: '😴' },
  nutrition:   { label: 'Nutrition',    icon: '🥗' },
  lecture:     { label: 'Lecture',      icon: '📚' },
  hydratation: { label: 'Hydratation', icon: '💧' },
  skin:        { label: 'Skin care',    icon: '✨' },
};

function FinalSummary({ data, onDone }: { data: any; onDone: () => void }) {
  const { calories, proteines, rythme } = calcNutrition(
    data.age, data.poids, data.taille, data.sexe, data.activite, data.objectifNutrition
  );

  const objectif = OBJECTIF_LABELS[data.objectifPrincipal] ?? { label: data.objectifPrincipal, icon: '⚔' };

  // Sections animées indépendamment
  const titleAnim   = useRef(new Animated.Value(0)).current;
  const objAnim     = useRef(new Animated.Value(0)).current;
  const habAnims    = useRef((data.habitudes as string[]).map(() => new Animated.Value(0))).current;
  const nutriAnims  = useRef([0,1,2].map(() => new Animated.Value(0))).current;
  const closingAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const habStagger = Animated.stagger(80, habAnims.map(a =>
      Animated.spring(a, { toValue: 1, tension: 60, friction: 10, useNativeDriver: true })
    ));
    const nutriStagger = Animated.stagger(80, nutriAnims.map(a =>
      Animated.spring(a, { toValue: 1, tension: 60, friction: 10, useNativeDriver: true })
    ));
    Animated.sequence([
      Animated.spring(titleAnim, { toValue: 1, tension: 50, friction: 12, useNativeDriver: true }),
      Animated.delay(100),
      Animated.spring(objAnim,   { toValue: 1, tension: 60, friction: 10, useNativeDriver: true }),
      Animated.delay(80),
      habStagger,
      Animated.delay(80),
      nutriStagger,
      Animated.delay(200),
      Animated.timing(closingAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start(onDone);
  }, []);

  const Row = ({ anim, icon, label, value }: { anim: Animated.Value; icon: string; label: string; value: string }) => (
    <Animated.View style={[s.summaryRow, {
      opacity: anim,
      transform: [{ translateX: anim.interpolate({ inputRange: [0,1], outputRange: [-16, 0] }) }],
    }]}>
      <Text style={{ fontSize: 18, marginRight: 14 }}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 9, color: C.dim, letterSpacing: 2, textTransform: 'uppercase' }}>{label}</Text>
        <Text style={{ fontFamily: 'Cinzel', fontSize: 14, color: GOLDB, marginTop: 2 }}>{value}</Text>
      </View>
    </Animated.View>
  );

  const nutri = [
    { icon: '🔥', label: 'Calories cibles', value: `${calories} kcal/j` },
    { icon: '⚡', label: 'Protéines',        value: `${proteines} g/j`   },
    { icon: '📈', label: 'Progression',      value: rythme              },
  ];

  return (
    <View style={{ paddingHorizontal: 24, paddingBottom: 20 }}>

      {/* Titre */}
      <Animated.Text style={{
        fontFamily: 'Cinzel', fontSize: 11, color: GOLD, letterSpacing: 4,
        textAlign: 'center', marginBottom: 24,
        opacity: titleAnim,
        transform: [{ translateY: titleAnim.interpolate({ inputRange: [0,1], outputRange: [-8, 0] }) }],
      }}>
        TON PLAN DE TRANSFORMATION
      </Animated.Text>

      {/* Objectif principal — mis en avant */}
      <Animated.View style={[s.summaryRow, {
        borderColor: GOLD + '55', backgroundColor: 'rgba(201,168,76,0.07)',
        marginBottom: 16,
        opacity: objAnim,
        transform: [{ translateX: objAnim.interpolate({ inputRange: [0,1], outputRange: [-16, 0] }) }],
      }]}>
        <Text style={{ fontSize: 22, marginRight: 14 }}>{objectif.icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 9, color: GOLD, letterSpacing: 2, textTransform: 'uppercase' }}>Objectif principal</Text>
          <Text style={{ fontFamily: 'Cinzel', fontSize: 15, color: GOLDB, marginTop: 2 }}>{objectif.label}</Text>
        </View>
      </Animated.View>

      {/* Piliers choisis */}
      <Text style={{ fontSize: 9, color: C.dim, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>
        Tes piliers
      </Text>
      {(data.habitudes as string[]).map((h, i) => {
        const hab = HABITUDE_LABELS[h] ?? { label: h, icon: '•' };
        return <Row key={h} anim={habAnims[i]} icon={hab.icon} label="Pilier" value={hab.label} />;
      })}

      {/* Séparateur */}
      <View style={{ height: 1, backgroundColor: GOLD + '22', marginVertical: 16 }} />

      {/* Nutrition — outil, pas finalité */}
      <Text style={{ fontSize: 9, color: C.dim, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>
        Tes repères nutrition
      </Text>
      {nutri.map((n, i) => (
        <Row key={n.label} anim={nutriAnims[i]} icon={n.icon} label={n.label} value={n.value} />
      ))}

      {/* Rang de départ */}
      <View style={{ height: 1, backgroundColor: GOLD + '22', marginVertical: 16 }} />
      <Animated.View style={[s.summaryRow, {
        opacity: closingAnim,
        transform: [{ translateX: closingAnim.interpolate({ inputRange: [0,1], outputRange: [-16, 0] }) }],
      }]}>
        <Text style={{ fontSize: 18, marginRight: 14 }}>⚔</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 9, color: C.dim, letterSpacing: 2, textTransform: 'uppercase' }}>Rang de départ</Text>
          <Text style={{ fontFamily: 'Cinzel', fontSize: 14, color: GOLDB, marginTop: 2 }}>NOVICE</Text>
        </View>
      </Animated.View>

      {/* Citation de clôture */}
      <Animated.Text style={{
        fontSize: 12, color: '#EAE0CC', textAlign: 'center',
        marginTop: 24, fontStyle: 'italic', lineHeight: 20, letterSpacing: 0.3,
        opacity: closingAnim,
      }}>
        "Les chiffres sont un outil. La transformation, elle, vient de toi."
      </Animated.Text>

      <Text style={{ fontSize: 10, color: '#555', textAlign: 'center', marginTop: 10, lineHeight: 16, paddingHorizontal: 10 }}>
        Estimations basées sur tes données. Ajustable à tout moment dans ton profil.
      </Text>
    </View>
  );
}

// ─── ÉTAPES ───────────────────────────────────────────────────────────────────
type StepId =
  | 'lore_system' | 'lore_truth' | 'q_transition'
  | 'q_sexe'
  | 'q_name' | 'q_age' | 'q_taille' | 'q_poids'
  | 'q_activite'
  | 'q_objectif_principal' | 'q_objectif_nutrition'
  | 'q_habitudes'
  | 'q_final';

const STEPS: { id: StepId; type: 'lore' | 'quiz' | 'final'; kriosText: string; }[] = [
  // ── Voix AEGIS — système, froid, lapidaire ───────────────────────────────────
  { id: 'lore_system',  type: 'lore', kriosText: "Système AEGIS. Corps. Esprit. Discipline.\nUn potentiel a été détecté." },
  { id: 'lore_truth',   type: 'lore', kriosText: "La motivation est un mensonge. La discipline, elle, ne ment jamais." },
  { id: 'q_transition', type: 'lore', kriosText: "Un guide t'a été assigné.\nChoisis-le." },

  // ── Révélation du guide ──────────────────────────────────────────────────────
  { id: 'q_sexe', type: 'quiz', kriosText: "" },

  // ── Le guide prend la parole ─────────────────────────────────────────────────
  { id: 'q_name',       type: 'quiz', kriosText: "Ton prénom, guerrier." },
  { id: 'q_age',        type: 'quiz', kriosText: "Ton âge. Chaque phase de vie a ses leviers." },
  { id: 'q_taille',     type: 'quiz', kriosText: "Ta taille. On calibre tout à partir de toi." },
  { id: 'q_poids',      type: 'quiz', kriosText: "Ton poids actuel. Pas un jugement — un point de départ." },
  { id: 'q_activite',   type: 'quiz', kriosText: "Ton rythme de vie réel. Pas ce que tu veux être — ce que tu es aujourd'hui." },
  { id: 'q_objectif_principal', type: 'quiz', kriosText: "Pourquoi es-tu là ? Pas la réponse que tu crois devoir donner. La vraie." },
  { id: 'q_objectif_nutrition', type: 'quiz', kriosText: "La nutrition est un outil, pas une obsession. Quel est ton cap ?" },
  { id: 'q_habitudes',  type: 'quiz', kriosText: "La transformation ne vient pas d'un seul effort. Choisis tes piliers." },
  { id: 'q_final', type: 'final', kriosText: "Ton plan est forgé. Le reste t'appartient." },
];

// ─── Character Picker (q_sexe) ────────────────────────────────────────────────
function CharacterPicker({ onSelect }: { onSelect: (s: 'homme' | 'femme') => void }) {
  const [selected, setSelected]  = useState<'homme' | 'femme' | null>(null);
  const kriosGlow    = useRef(new Animated.Value(0)).current;
  const aspasiaGlow  = useRef(new Animated.Value(0)).current;
  const kriosScale   = useRef(new Animated.Value(1)).current;
  const aspasiaScale = useRef(new Animated.Value(1)).current;
  const entranceAnim = useRef(new Animated.Value(0)).current;
  const ctaAnim      = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(entranceAnim, { toValue: 1, tension: 40, friction: 12, useNativeDriver: true }).start();
  }, []);

  // Bouton valider slide-up quand une sélection est faite
  useEffect(() => {
    Animated.timing(ctaAnim, {
      toValue: selected ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [selected]);

  function pick(s: 'homme' | 'femme') {
    setSelected(s);
    const mainGlow  = s === 'homme' ? kriosGlow   : aspasiaGlow;
    const otherGlow = s === 'homme' ? aspasiaGlow : kriosGlow;
    const mainSc    = s === 'homme' ? kriosScale  : aspasiaScale;
    const otherSc   = s === 'homme' ? aspasiaScale : kriosScale;
    Animated.parallel([
      Animated.timing(mainGlow,  { toValue: 1,    duration: 280, useNativeDriver: false }),
      Animated.timing(otherGlow, { toValue: 0,    duration: 280, useNativeDriver: false }),
      Animated.spring(mainSc,  { toValue: 1.04, tension: 200, friction: 10, useNativeDriver: true }),
      Animated.spring(otherSc, { toValue: 0.93, tension: 200, friction: 10, useNativeDriver: true }),
    ]).start();
  }

  const CARD_W = (width - 52) / 2;
  const CARD_H = height * 0.52;

  return (
    <Animated.View style={{
      alignItems: 'center',
      opacity: entranceAnim,
      transform: [{ translateY: entranceAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
    }}>
      <Text style={{
        fontFamily: 'Cinzel', fontSize: 10, color: GOLD,
        letterSpacing: 4, textAlign: 'center', marginBottom: 22,
      }}>
        CHOISIS TON PERSONNAGE
      </Text>

      <View style={{ flexDirection: 'row', gap: 14 }}>
        {/* ── KRIOS ── */}
        <Animated.View style={{ transform: [{ scale: kriosScale }] }}>
          <TouchableOpacity onPress={() => pick('homme')} activeOpacity={0.88}>
            <Animated.View style={{
              width: CARD_W, height: CARD_H, borderRadius: 20,
              borderWidth: 2,
              borderColor: kriosGlow.interpolate({ inputRange: [0, 1], outputRange: ['#252018', GOLD] }),
            }}>
              <View style={{ flex: 1, borderRadius: 18, overflow: 'hidden' }}>
                <Image source={KRIOS_IMG} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.78)']} style={StyleSheet.absoluteFillObject} />
                <Animated.View style={[StyleSheet.absoluteFillObject, { backgroundColor: GOLD + '18', opacity: kriosGlow }]} />
                <View style={{ position: 'absolute', bottom: 18, left: 0, right: 0, alignItems: 'center' }}>
                  <Text style={{ fontFamily: 'Cinzel', fontSize: 13, color: GOLDB, letterSpacing: 3 }}>KRIOS</Text>
                  <Text style={{ fontSize: 10, color: '#777', marginTop: 4, letterSpacing: 2 }}>HOMME</Text>
                </View>
              </View>
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>

        {/* ── ASPASIA ── */}
        <Animated.View style={{ transform: [{ scale: aspasiaScale }] }}>
          <TouchableOpacity onPress={() => pick('femme')} activeOpacity={0.88}>
            <Animated.View style={{
              width: CARD_W, height: CARD_H, borderRadius: 20,
              borderWidth: 2,
              borderColor: aspasiaGlow.interpolate({ inputRange: [0, 1], outputRange: ['#252018', GOLD] }),
            }}>
              <View style={{ flex: 1, borderRadius: 18, overflow: 'hidden' }}>
                <Image source={ASPASIA_IMG} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.78)']} style={StyleSheet.absoluteFillObject} />
                <Animated.View style={[StyleSheet.absoluteFillObject, { backgroundColor: GOLD + '18', opacity: aspasiaGlow }]} />
                <View style={{ position: 'absolute', bottom: 18, left: 0, right: 0, alignItems: 'center' }}>
                  <Text style={{ fontFamily: 'Cinzel', fontSize: 13, color: GOLDB, letterSpacing: 3 }}>ASPASIA</Text>
                  <Text style={{ fontSize: 10, color: '#777', marginTop: 4, letterSpacing: 2 }}>FEMME</Text>
                </View>
              </View>
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* ── Bouton valider (slide-up après sélection) ── */}
      <Animated.View style={{
        width: '100%', marginTop: 20,
        opacity: ctaAnim,
        transform: [{ translateY: ctaAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
      }}>
        <TouchableOpacity
          onPress={() => selected && onSelect(selected)}
          activeOpacity={0.85}
          disabled={!selected}
          style={{ borderRadius: 16, overflow: 'hidden' }}
        >
          <LinearGradient colors={[GOLDB, GOLD]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{ paddingVertical: 18, alignItems: 'center' }}>
            <Text style={{ color: '#000', fontWeight: '800', fontSize: 14, letterSpacing: 2 }}>
              {selected === 'homme' ? 'CHOISIR KRIOS  ⚔' : selected === 'femme' ? 'CHOISIR ASPASIA  🌙' : 'VALIDER'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
type Props = { userId: string; onComplete: () => void };

export default function OnboardingScreen({ userId, onComplete }: Props) {
  const [stepIdx, setStepIdx]     = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [textDone, setTextDone]   = useState(false);
  const [saving,   setSaving]     = useState(false);

  // Données utilisateur
  const [name,     setName]     = useState('');
  const [sexe,     setSexe]     = useState('');
  const [age,      setAge]      = useState(22);
  const [taille,   setTaille]   = useState(175);
  const [poids,    setPoids]    = useState(75);
  const [activite, setActivite] = useState('');
  const [objectifPrincipal, setObjectifPrincipal] = useState('');
  const [objectifNutrition, setObjectifNutrition] = useState('');
  const [habitudes, setHabitudes] = useState<string[]>([]);

  const stepFade = useRef(new Animated.Value(1)).current;
  const kriosAnim = useRef(new Animated.Value(0)).current;
  const ctaAnim   = useRef(new Animated.Value(0)).current;
  const femaleAnim = useRef(new Animated.Value(0)).current;

  const { speak, prefetch, stop } = useNarration();

  // Détermine le narrateur courant
  function currentNarrator(): 'AEGIS' | 'KRIOS' | 'ASPASIA' {
    if (stepIdx < SEXE_STEP_IDX) return 'AEGIS';
    if (sexe === 'femme') return 'ASPASIA';
    return 'KRIOS';
  }

  function narratorForIdx(idx: number): 'AEGIS' | 'KRIOS' | 'ASPASIA' {
    if (idx < SEXE_STEP_IDX) return 'AEGIS';
    if (sexe === 'femme') return 'ASPASIA';
    return 'KRIOS';
  }

  // Lance la voix + précharge la suivante
  useEffect(() => {
    const text = STEPS[stepIdx]?.kriosText;
    if (!text || step.id === 'q_sexe') return;
    speak(text, currentNarrator());
    // Précharge le step suivant pendant que la voix joue
    const next = STEPS[stepIdx + 1];
    if (next?.kriosText && next.id !== 'q_sexe') {
      prefetch(next.kriosText, narratorForIdx(stepIdx + 1));
    }
    return () => stop();
  }, [stepIdx]);

  // Crossfade KRIOS ↔ Aspasia selon le sexe
  useEffect(() => {
    Animated.timing(femaleAnim, {
      toValue: sexe === 'femme' ? 1 : 0,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [sexe]);

  // Adapte le texte au genre (guerrier → guerrière)
  function genderText(text: string) {
    return sexe === 'femme'
      ? text.replace(/guerrier/g, 'guerrière').replace(/Guerrier/g, 'Guerrière')
      : text;
  }

  const step = STEPS[stepIdx];
  const isLast = step.id === 'q_final';
  const SEXE_STEP_IDX = STEPS.findIndex(s => s.id === 'q_sexe');

  // Le personnage n'apparaît qu'après q_sexe — fondu + remontée
  const kriosOpacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (stepIdx === SEXE_STEP_IDX + 1) {
      Animated.parallel([
        Animated.timing(kriosOpacity, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.spring(kriosAnim, { toValue: 1, tension: 28, friction: 14, useNativeDriver: true }),
      ]).start();
    }
  }, [stepIdx]);

  // Transition d'étape (sans vérification canProceed ni submit final)
  const advanceStep = useCallback(() => {
    stop(); // coupe l'audio immédiatement
    const nextIdx = stepIdx + 1;
    Animated.timing(progressAnim, {
      toValue: nextIdx / (STEPS.length - 1),
      duration: 500,
      useNativeDriver: false,
    }).start();
    Animated.timing(stepFade, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
      setStepIdx(nextIdx);
      setTextDone(false);
      Animated.timing(stepFade, { toValue: 1, duration: 280, useNativeDriver: true }).start();
    });
  }, [stepIdx, stop]);

  // Sélection personnage → set sexe + avance (animation déjà terminée côté picker)
  function handleCharacterSelect(s: 'homme' | 'femme') {
    setSexe(s);
    setTimeout(advanceStep, 150);
  }

  // CTA pulse
  useEffect(() => {
    if (textDone) {
      Animated.timing(ctaAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    } else {
      Animated.timing(ctaAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    }
  }, [textDone]);

  function canProceed(): boolean {
    switch (step.id) {
      case 'q_name':     return name.trim().length > 0;
      case 'q_sexe':     return sexe !== '';
      case 'q_activite': return activite !== '';
      case 'q_objectif_principal': return objectifPrincipal !== '';
      case 'q_objectif_nutrition': return objectifNutrition !== '';
      case 'q_habitudes': return habitudes.length >= 3;
      default: return textDone;
    }
  }

  const goNext = useCallback(async () => {
    if (!canProceed()) return;
    if (isLast) {
      setSaving(true);
      const { calories, proteines } = calcNutrition(age, poids, taille, sexe, activite, objectifNutrition);
      const genderValue = sexe === 'femme' ? 'female' : 'male';
      await saveGender(genderValue); // sauvegarde immédiate en local
      await supabase.from('profiles').update({
        name: name.trim(),
        cal_target: calories,
        prot_target: proteines,
        goal: objectifPrincipal,
        gender: genderValue,
        onboarding_done: true,
      }).eq('id', userId);
      setSaving(false);
      onComplete();
      return;
    }
    advanceStep();
  }, [stepIdx, name, sexe, age, taille, poids, activite, objectifPrincipal, objectifNutrition, habitudes, textDone, isLast, advanceStep]);

  const kriosY = kriosAnim.interpolate({ inputRange: [0,1], outputRange: [60, 0] });

  function toggleHabitude(h: string) {
    setHabitudes(prev =>
      prev.includes(h) ? prev.filter(x => x !== h) : prev.length < 3 ? [...prev, h] : prev
    );
  }

  // ─── Quiz content par étape ────────────────────────────────────────────────
  function renderQuizContent() {
    switch (step.id) {
      case 'q_name':
        return (
          <TextInput
            style={s.nameInput} value={name} onChangeText={setName}
            placeholder="Ton prénom..." placeholderTextColor={C.dim}
            autoCorrect={false} autoCapitalize="words"
            returnKeyType="done" selectionColor={GOLD}
            onSubmitEditing={goNext}
          />
        );

      case 'q_sexe': return null; // géré par CharacterPicker hors ScrollView

      case 'q_age':
        return <View onStartShouldSetResponder={() => true}><ElegantSlider value={age} min={15} max={65} unit="ans" onChange={setAge} /></View>;

      case 'q_taille':
        return <View onStartShouldSetResponder={() => true}><ElegantSlider value={taille} min={140} max={220} unit="cm" onChange={setTaille} /></View>;

      case 'q_poids':
        return <View onStartShouldSetResponder={() => true}><ElegantSlider value={poids} min={40} max={200} unit="kg" onChange={setPoids} /></View>;

      case 'q_activite':
        return (
          <View style={s.chipGrid}>
            {[
              { id: 'sedentaire',  label: 'Sédentaire',      sub: 'Bureau, peu de sport',     emoji: '💺' },
              { id: 'leger',       label: 'Légèrement actif', sub: '1-2 séances/semaine',      emoji: '🚶' },
              { id: 'actif',       label: 'Actif',            sub: '3-4 séances/semaine',      emoji: '🏃' },
              { id: 'tres_actif',  label: 'Très actif',       sub: '5+ séances ou travail physique', emoji: '⚡' },
            ].map(o => (
              <Chip key={o.id} label={o.label} sub={o.sub} emoji={o.emoji}
                selected={activite === o.id} onPress={() => setActivite(o.id)} />
            ))}
          </View>
        );

      case 'q_objectif_principal':
        return (
          <View style={s.chipGrid}>
            {[
              { id: 'perte_poids',   label: 'Perdre du poids',         emoji: '🔥' },
              { id: 'muscle',        label: 'Construire du muscle',     emoji: '💪' },
              { id: 'transformation',label: 'Transformation complète',  emoji: '⚔' },
              { id: 'discipline',    label: 'Discipline & routine',     emoji: '🧠' },
              { id: 'confiance',     label: 'Reprendre confiance',      emoji: '✨' },
              { id: 'optimiser',     label: 'Optimiser mon physique',   emoji: '🎯' },
            ].map(o => (
              <Chip key={o.id} label={o.label} emoji={o.emoji}
                selected={objectifPrincipal === o.id}
                onPress={() => setObjectifPrincipal(o.id)} />
            ))}
          </View>
        );

      case 'q_objectif_nutrition':
        return (
          <View style={s.chipGrid}>
            {[
              { id: 'perte',    label: 'Perdre du poids',    sub: 'Déficit calorique',   emoji: '📉' },
              { id: 'muscle',   label: 'Prendre du muscle',  sub: 'Surplus calorique',   emoji: '📈' },
              { id: 'maintien', label: 'Maintenir',          sub: 'Équilibre calorique',  emoji: '⚖️' },
            ].map(o => (
              <Chip key={o.id} label={o.label} sub={o.sub} emoji={o.emoji}
                selected={objectifNutrition === o.id}
                onPress={() => setObjectifNutrition(o.id)} />
            ))}
          </View>
        );

      case 'q_habitudes':
        const ALL_HABITS = ['sport', 'sommeil', 'nutrition', 'lecture', 'hydratation', 'skin'];
        const isAll = ALL_HABITS.every(h => habitudes.includes(h));
        return (
          <View>
            <Text style={{ color: GOLD, fontSize: 10, textAlign: 'center', marginBottom: 12, letterSpacing: 1 }}>
              {isAll ? 'Tout sélectionné ✓' : `${habitudes.length}/3 sélectionnés`}
            </Text>
            <View style={s.chipGrid}>
              {[
                { id: 'sport',       label: 'Séance',       emoji: '🏋️' },
                { id: 'sommeil',     label: 'Sommeil',      emoji: '😴' },
                { id: 'nutrition',   label: 'Nutrition',    emoji: '🥗' },
                { id: 'lecture',     label: 'Lecture',      emoji: '📚' },
                { id: 'hydratation', label: 'Hydratation',  emoji: '💧' },
                { id: 'skin',        label: 'Skin care',    emoji: '✨' },
              ].map(o => (
                <Chip key={o.id} label={o.label} emoji={o.emoji}
                  selected={habitudes.includes(o.id)}
                  onPress={() => toggleHabitude(o.id)}
                />
              ))}
              {/* Option Tout */}
              <TouchableOpacity
                onPress={() => setHabitudes(isAll ? [] : ALL_HABITS)}
                style={[s.chip, { width: '100%', flexDirection: 'row', justifyContent: 'center', gap: 8 }, isAll && { backgroundColor: GOLD + '22', borderColor: GOLD }]}
              >
                <Text style={{ fontSize: 16 }}>⚔</Text>
                <Text style={[s.chipLabel, isAll && { color: GOLD }]}>Tout — Transformation complète</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      default: return null;
    }
  }

  const ctaLabel = saving ? 'CHARGEMENT...'
    : isLast ? 'FORGER MON AEGIS  ⚔'
    : step.type === 'lore' ? 'CONTINUER  →'
    : 'CONFIRMER  →';

  const showCTA = step.id === 'q_sexe' ? false
    : step.type === 'lore' ? textDone
    : canProceed();

  return (
    <View style={{ flex: 1, backgroundColor: '#04020A' }}>
      <Particles />

      {/* Personnage — visible seulement après le choix du sexe */}
      {stepIdx > SEXE_STEP_IDX && (
        <Animated.View style={[s.kriosWrap, {
          opacity: kriosOpacity,
          transform: [{ translateY: kriosY }],
        }]}>
          {/* KRIOS — homme */}
          <Animated.View style={[s.kriosImg, {
            opacity: femaleAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
          }]}>
            <Image source={KRIOS_IMG} style={s.kriosImg} resizeMode="cover" />
          </Animated.View>
          {/* ASPASIA — femme */}
          <Animated.View style={[s.kriosImg, StyleSheet.absoluteFillObject, { opacity: femaleAnim }]}>
            <Image source={ASPASIA_IMG} style={s.kriosImg} resizeMode="cover" />
          </Animated.View>
          <LinearGradient colors={['#04020A', '#04020Aaa', 'transparent']} locations={[0, 0.2, 0.5]}
            style={[StyleSheet.absoluteFillObject, { top: 0 }]} />
          <LinearGradient colors={['transparent', '#04020A']} locations={[0.65, 1]}
            style={StyleSheet.absoluteFillObject} />
        </Animated.View>
      )}

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

          {/* Barre de progression animée */}
          <View style={s.progressBar}>
            <Animated.View style={[s.progressFill, {
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            }]} />
          </View>

          <Animated.View style={{ flex: 1, opacity: stepFade }}>
            {/* ── CharacterPicker full screen sur q_sexe ── */}
            {step.id === 'q_sexe' ? (
              <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 18, paddingTop: 16 }}>
                <CharacterPicker onSelect={handleCharacterSelect} />
              </View>
            ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
              keyboardShouldPersistTaps="handled"
              scrollEnabled={!['q_age', 'q_taille', 'q_poids'].includes(step.id)}
            >
              {/* Bulle KRIOS */}
              <View style={{ paddingHorizontal: 20, marginTop: 10 }}>
                <KriosBubble
                  key={stepIdx}
                  text={genderText(step.kriosText || `"Voici le chemin que nous avons forgé pour toi."`)}
                  narrator={stepIdx < SEXE_STEP_IDX
                    ? 'AEGIS'
                    : stepIdx > SEXE_STEP_IDX
                      ? (sexe === 'femme' ? 'ASPASIA' : 'KRIOS')
                      : undefined}
                  onDone={() => setTextDone(true)}
                />
              </View>

              {/* Contenu quiz */}
              {step.type === 'quiz' && (
                <Animated.View style={{ paddingHorizontal: 20, marginTop: 20 }}>
                  {renderQuizContent()}
                </Animated.View>
              )}

              {/* Résumé final */}
              {step.type === 'final' && (
                <View style={{ marginTop: 20 }}>
                  <FinalSummary
                    data={{ name, sexe, age, taille, poids, activite, objectifNutrition, objectifPrincipal, habitudes }}
                    onDone={() => setTextDone(true)}
                  />
                </View>
              )}

            </ScrollView>
            )}
          </Animated.View>

          {/* Bottom */}
          <View style={s.bottomZone}>
            {stepIdx < SEXE_STEP_IDX && step.type === 'lore' && (
              <TouchableOpacity onPress={() => setStepIdx(SEXE_STEP_IDX)} style={{ alignSelf: 'center', marginBottom: 6 }}>
                <Text style={{ color: '#333', fontSize: 11, letterSpacing: 1 }}>Passer l'intro</Text>
              </TouchableOpacity>
            )}

            {showCTA ? (
              <Animated.View style={{ opacity: ctaAnim }}>
                <TouchableOpacity onPress={goNext} activeOpacity={0.85} disabled={saving} style={s.cta}>
                  <LinearGradient colors={[GOLDB, GOLD]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.ctaGrad}>
                    <Text style={s.ctaText}>{ctaLabel}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            ) : step.type === 'lore' ? (
              <TouchableOpacity onPress={() => { setTextDone(true); }} style={s.tapHint}>
                <Text style={s.tapHintText}>Appuie pour continuer</Text>
              </TouchableOpacity>
            ) : null}
          </View>

        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  kriosWrap: { position: 'absolute', bottom: 0, left: 0, right: 0, height: height * 0.7 },
  kriosImg:  { width: '100%', height: '100%' },

  progressBar:  { height: 2, backgroundColor: '#1a1a1a', marginHorizontal: 0 },
  progressFill: { height: 2, backgroundColor: GOLD },

  bubble: {
    backgroundColor: 'rgba(8,6,2,0.9)', borderWidth: 1,
    borderColor: GOLD + '44', borderRadius: 16, padding: 16,
  },
  bubbleText: { fontSize: 14, color: '#E8E0D0', lineHeight: 22, letterSpacing: 0.2 },

  nameInput: {
    backgroundColor: 'rgba(20,14,0,0.92)', borderWidth: 1, borderColor: GOLD + '66',
    borderRadius: 14, padding: 16, color: '#E8E0D0', fontSize: 18,
    textAlign: 'center', letterSpacing: 2, fontFamily: 'Cinzel',
  },

  chipRow:  { flexDirection: 'row', gap: 12, justifyContent: 'center' },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  chip: {
    backgroundColor: 'rgba(20,14,0,0.85)', borderWidth: 1.5, borderColor: '#2a2520',
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
    alignItems: 'center', minWidth: 120,
  },
  chipLabel: { fontSize: 13, color: C.dim, fontWeight: '600', textAlign: 'center' },
  chipSub:   { fontSize: 10, color: '#3a3530', marginTop: 3, textAlign: 'center' },

  sliderValue: {
    alignItems: 'center', backgroundColor: 'rgba(20,14,0,0.9)',
    borderWidth: 1.5, borderColor: GOLD + '44', borderRadius: 16,
    paddingHorizontal: 28, paddingVertical: 16,
  },

  summaryRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(20,14,0,0.8)', borderWidth: 1, borderColor: GOLD + '33',
    borderRadius: 14, padding: 16, marginBottom: 10,
  },

  bottomZone: { paddingHorizontal: 20, paddingBottom: 8, gap: 6 },
  cta:        { borderRadius: 16, overflow: 'hidden' },
  ctaGrad:    { paddingVertical: 18, alignItems: 'center', justifyContent: 'center' },
  ctaText:    { color: '#000', fontWeight: '800', fontSize: 14, letterSpacing: 2, textAlign: 'center', width: '100%' },
  tapHint:    { alignItems: 'center', paddingVertical: 12 },
  tapHintText:{ color: '#2a2520', fontSize: 11, letterSpacing: 1 },
});
