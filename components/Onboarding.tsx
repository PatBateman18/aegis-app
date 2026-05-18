// components/Onboarding.tsx
// Onboarding narratif AEGIS — KRIOS comme guide cinématique
import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Dimensions, TextInput, Alert, Animated,
  KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { C } from '@/constants/colors';
import { supabase } from '@/lib/supabase';

const { width, height } = Dimensions.get('window');
const GOLD  = '#C9A84C';
const GOLDB = '#E8C46A';
const GOLDD = '#C9A84C33';

const KRIOS_IMG = require('@/assets/krios.png');

// ─── Scènes narratives ────────────────────────────────────────────────────────
const SCENES = [
  {
    id: 'intro',
    speaker: 'KRIOS',
    text: "Je suis Krios. Il y a des années, j'étais perdu comme toi. Pas sans potentiel. Sans direction.",
    sub: null,
    showInput: false,
  },
  {
    id: 'lost',
    speaker: 'KRIOS',
    text: "Motivation un jour. Fatigue le lendemain. Et chaque soir, cette même sensation : celle de pouvoir devenir quelqu'un de grand… sans jamais vraiment avancer.",
    sub: null,
    showInput: false,
  },
  {
    id: 'truth',
    speaker: 'KRIOS',
    text: "Puis j'ai compris. Les hommes ne sont pas transformés par un seul moment. Ils sont transformés par ce qu'ils font chaque jour.",
    sub: null,
    showInput: false,
  },
  {
    id: 'aegis',
    speaker: 'KRIOS',
    text: "AEGIS est ce chemin. Pas une app de productivité. Un système pour reconstruire ton corps, ton esprit et ta discipline — jour après jour.",
    sub: null,
    showInput: false,
  },
  {
    id: 'promise',
    speaker: 'KRIOS',
    text: "Tu commenceras peut-être faible. Inconstant. Mais si tu avances chaque jour… tu verras quelque chose changer. Pas seulement tes résultats. Toi.",
    sub: null,
    showInput: false,
  },
  {
    id: 'name',
    speaker: 'KRIOS',
    text: "Je serai là pour te guider. Maintenant… dis-moi qui tu veux devenir.",
    sub: null,
    showInput: 'name',
  },
  {
    id: 'nutrition',
    speaker: 'KRIOS',
    text: "Bien. Fixons tes objectifs nutritionnels — ils guideront ta progression Corps.",
    sub: null,
    showInput: 'nutrition',
  },
  {
    id: 'final',
    speaker: 'KRIOS',
    text: "Le voyage commence maintenant. Chaque jour est une bataille. Ne recule jamais.",
    sub: 'Forge ta légende.',
    showInput: false,
  },
] as const;

// ─── Particules flottantes ────────────────────────────────────────────────────
function Particles() {
  const particles = useRef(
    Array.from({ length: 16 }, (_, i) => ({
      id: i,
      x: 15 + Math.random() * (width - 30),
      delay: i * 500 + Math.random() * 800,
      dur: 6000 + Math.random() * 4000,
      anim: new Animated.Value(height + 10),
      op: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    particles.forEach(p => {
      const loop = () => {
        p.anim.setValue(height + 10);
        p.op.setValue(0);
        Animated.sequence([
          Animated.delay(p.delay),
          Animated.parallel([
            Animated.timing(p.anim, { toValue: -20, duration: p.dur, useNativeDriver: true }),
            Animated.sequence([
              Animated.timing(p.op, { toValue: 0.55, duration: 700, useNativeDriver: true }),
              Animated.timing(p.op, { toValue: 0.55, duration: p.dur - 1400, useNativeDriver: true }),
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
          backgroundColor: GOLDB,
          opacity: p.op,
          transform: [{ translateY: p.anim }],
        }} />
      ))}
    </View>
  );
}

// ─── Texte typewriter ─────────────────────────────────────────────────────────
function TypewriterText({ text, style, onDone }: {
  text: string; style?: any; onDone?: () => void;
}) {
  const [displayed, setDisplayed] = useState('');
  const idx = useRef(0);
  const timer = useRef<any>(null);

  useEffect(() => {
    setDisplayed('');
    idx.current = 0;
    const type = () => {
      if (idx.current < text.length) {
        idx.current++;
        setDisplayed(text.slice(0, idx.current));
        const delay = text[idx.current - 1] === '.' || text[idx.current - 1] === ',' ? 80 : 28;
        timer.current = setTimeout(type, delay);
      } else {
        onDone?.();
      }
    };
    timer.current = setTimeout(type, 300);
    return () => clearTimeout(timer.current);
  }, [text]);

  return <Text style={style}>{displayed}<Text style={{ opacity: 0 }}>|</Text></Text>;
}

// ─── Bulle dialogue KRIOS ─────────────────────────────────────────────────────
function DialogueBubble({ scene, onDone }: { scene: typeof SCENES[number]; onDone: () => void }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
    ]).start();
  }, [scene.id]);

  return (
    <Animated.View style={[s.bubble, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      {/* Nom du speaker */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: GOLD }} />
        <Text style={{ fontFamily: 'Cinzel', fontSize: 10, color: GOLD, letterSpacing: 3 }}>
          {scene.speaker}
        </Text>
      </View>
      {/* Texte typewriter */}
      <TypewriterText
        text={scene.text}
        style={s.bubbleText}
        onDone={onDone}
      />
    </Animated.View>
  );
}

// ─── Input prénom ─────────────────────────────────────────────────────────────
function NameInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: 1, tension: 60, friction: 10, useNativeDriver: true, delay: 600 }).start();
  }, []);
  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0,1], outputRange: [20, 0] }) }] }}>
      <TextInput
        style={s.nameInput}
        value={value}
        onChangeText={onChange}
        placeholder="Ton prénom..."
        placeholderTextColor={C.dim}
        autoCorrect={false}
        autoCapitalize="words"
        returnKeyType="done"
        selectionColor={GOLD}
      />
    </Animated.View>
  );
}

// ─── Input nutrition ──────────────────────────────────────────────────────────
function NutritionInput({
  cal, prot, onCal, onProt,
}: { cal: string; prot: string; onCal: (v: string) => void; onProt: (v: string) => void }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: 1, tension: 60, friction: 10, useNativeDriver: true, delay: 600 }).start();
  }, []);
  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0,1], outputRange: [20, 0] }) }], gap: 12 }}>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={s.nutritionLabel}>CALORIES</Text>
          <View style={s.nutritionRow}>
            <TextInput style={[s.nutritionInput, { flex: 1 }]} value={cal} onChangeText={onCal} keyboardType="numeric" selectionColor={GOLD} />
            <Text style={s.nutritionUnit}>kcal</Text>
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.nutritionLabel}>PROTÉINES</Text>
          <View style={s.nutritionRow}>
            <TextInput style={[s.nutritionInput, { flex: 1 }]} value={prot} onChangeText={onProt} keyboardType="numeric" selectionColor={GOLD} />
            <Text style={s.nutritionUnit}>g</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
type Props = { userId: string; onComplete: () => void };

export default function OnboardingScreen({ userId, onComplete }: Props) {
  const [step,       setStep]      = useState(0);
  const [textDone,   setTextDone]  = useState(false);
  const [name,       setName]      = useState('');
  const [cal,        setCal]       = useState('2300');
  const [prot,       setProt]      = useState('180');
  const [saving,     setSaving]    = useState(false);

  const kriosAnim   = useRef(new Animated.Value(0)).current;   // slide in initial
  const kriosScale  = useRef(new Animated.Value(0.92)).current;
  const stepFade    = useRef(new Animated.Value(1)).current;
  const ctaAnim     = useRef(new Animated.Value(0)).current;

  const scene = SCENES[step];
  const isLast = step === SCENES.length - 1;

  // Entrée initiale de KRIOS
  useEffect(() => {
    Animated.parallel([
      Animated.spring(kriosAnim,  { toValue: 1, tension: 40, friction: 10, useNativeDriver: true }),
      Animated.spring(kriosScale, { toValue: 1, tension: 50, friction: 12, useNativeDriver: true }),
    ]).start();
  }, []);

  // CTA pulse quand texte terminé
  useEffect(() => {
    if (textDone) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(ctaAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
          Animated.timing(ctaAnim, { toValue: 0.7, duration: 900, useNativeDriver: true }),
        ])
      ).start();
    } else {
      ctaAnim.setValue(0);
    }
  }, [textDone]);

  const goNext = useCallback(async () => {
    if (!textDone && !scene.showInput) return;

    // Validation
    if (scene.showInput === 'name' && !name.trim()) {
      Alert.alert('Entre ton prénom pour continuer'); return;
    }
    if (isLast) {
      setSaving(true);
      await supabase.from('profiles').update({
        name: name.trim() || 'Guerrier',
        cal_target:  parseInt(cal)  || 2300,
        prot_target: parseInt(prot) || 180,
        onboarding_done: true,
      }).eq('id', userId);
      setSaving(false);
      onComplete();
      return;
    }

    // Transition : fade out → step suivant → fade in
    Animated.timing(stepFade, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setStep(s => s + 1);
      setTextDone(false);
      Animated.timing(stepFade, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    });
  }, [textDone, scene, name, cal, prot, isLast, step]);

  const skipToEnd = () => {
    setStep(5);
    setTextDone(false);
  };

  const kriosY = kriosAnim.interpolate({ inputRange: [0, 1], outputRange: [120, 0] });
  const ctaOpacity = ctaAnim.interpolate({ inputRange: [0.7, 1], outputRange: [0.7, 1] });

  return (
    <View style={{ flex: 1, backgroundColor: '#04020A' }}>
      {/* Particules */}
      <Particles />

      {/* KRIOS — occupe le bas de l'écran */}
      <Animated.View style={[s.kriosContainer, {
        opacity: kriosAnim,
        transform: [{ translateY: kriosY }, { scale: kriosScale }],
      }]}>
        <Image source={KRIOS_IMG} style={s.kriosImage} resizeMode="cover" />
        {/* Gradient qui fond vers le haut */}
        <LinearGradient
          colors={['#04020A', '#04020Aaa', 'transparent']}
          locations={[0, 0.18, 0.45]}
          style={[StyleSheet.absoluteFillObject, { top: 0 }]}
        />
        {/* Gradient bas */}
        <LinearGradient
          colors={['transparent', '#04020A']}
          locations={[0.7, 1]}
          style={[StyleSheet.absoluteFillObject]}
        />
      </Animated.View>

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

          {/* Zone contenu haut */}
          <Animated.View style={{ flex: 1, opacity: stepFade }}>

            {/* Dots de progression */}
            <View style={s.dots}>
              {SCENES.map((_, i) => (
                <View key={i} style={[s.dot, i === step && s.dotActive, i < step && s.dotPast]} />
              ))}
            </View>

            {/* Bulle KRIOS */}
            <View style={{ paddingHorizontal: 24, marginTop: 12 }}>
              <DialogueBubble
                key={step}
                scene={scene}
                onDone={() => setTextDone(true)}
              />
            </View>

            {/* Inputs selon la scène */}
            {scene.showInput === 'name' && (
              <View style={{ paddingHorizontal: 24, marginTop: 16 }}>
                <NameInput value={name} onChange={setName} />
              </View>
            )}
            {scene.showInput === 'nutrition' && (
              <View style={{ paddingHorizontal: 24, marginTop: 16 }}>
                <NutritionInput cal={cal} prot={prot} onCal={setCal} onProt={setProt} />
              </View>
            )}

            {/* Sous-titre final */}
            {scene.sub && textDone && (
              <Animated.Text style={[s.finalSub, { opacity: ctaAnim }]}>
                {scene.sub}
              </Animated.Text>
            )}

          </Animated.View>

          {/* CTA en bas */}
          <View style={s.bottomZone}>
            {/* Bouton passer (pas sur dernière scène) */}
            {step < SCENES.length - 2 && (
              <TouchableOpacity onPress={skipToEnd} style={{ alignSelf: 'center', marginBottom: 8 }}>
                <Text style={{ color: C.dim, fontSize: 11, letterSpacing: 1 }}>Passer l'intro</Text>
              </TouchableOpacity>
            )}

            {/* Bouton principal */}
            {(textDone || scene.showInput) && (
              <Animated.View style={{ opacity: ctaOpacity }}>
                <TouchableOpacity
                  onPress={goNext}
                  activeOpacity={0.85}
                  disabled={saving}
                  style={s.cta}
                >
                  <LinearGradient
                    colors={[GOLDB, GOLD]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={s.ctaGrad}
                  >
                    <Text style={s.ctaText}>
                      {saving ? 'CHARGEMENT...' : isLast ? 'FORGER MON AEGIS  ⚔' : 'CONTINUER  →'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* Tap pour accélérer le texte */}
            {!textDone && !scene.showInput && (
              <TouchableOpacity onPress={() => setTextDone(true)} style={s.tapHint}>
                <Text style={s.tapHintText}>Appuie pour continuer</Text>
              </TouchableOpacity>
            )}
          </View>

        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  // KRIOS
  kriosContainer: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: height * 0.72,
  },
  kriosImage: {
    width: '100%', height: '100%',
  },

  // Dialogue
  bubble: {
    backgroundColor: 'rgba(8,6,2,0.88)',
    borderWidth: 1, borderColor: GOLD + '44',
    borderRadius: 16, padding: 18,
  },
  bubbleText: {
    fontSize: 16, color: C.text,
    lineHeight: 26, letterSpacing: 0.2,
  },

  // Inputs
  nameInput: {
    backgroundColor: 'rgba(20,14,0,0.9)',
    borderWidth: 1, borderColor: GOLD + '66',
    borderRadius: 14, padding: 16,
    color: C.text, fontSize: 18,
    textAlign: 'center',
    letterSpacing: 2,
    fontFamily: 'Cinzel',
  },
  nutritionLabel: {
    fontSize: 9, color: GOLD, letterSpacing: 2,
    textTransform: 'uppercase', marginBottom: 6,
  },
  nutritionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nutritionInput: {
    backgroundColor: 'rgba(20,14,0,0.9)',
    borderWidth: 1, borderColor: GOLD + '55',
    borderRadius: 12, padding: 14,
    color: C.text, fontSize: 16, textAlign: 'center',
  },
  nutritionUnit: { color: C.dim, fontSize: 12, width: 32 },

  // Final
  finalSub: {
    fontFamily: 'Cinzel', fontSize: 16,
    color: GOLDB, letterSpacing: 4,
    textAlign: 'center', marginTop: 20,
  },

  // Dots
  dots: {
    flexDirection: 'row', justifyContent: 'center',
    gap: 6, paddingTop: 12, paddingBottom: 4,
  },
  dot:      { width: 6, height: 6, borderRadius: 3, backgroundColor: C.s3 },
  dotActive:{ width: 20, height: 6, borderRadius: 3, backgroundColor: GOLD },
  dotPast:  { backgroundColor: GOLDD, borderWidth: 1, borderColor: GOLD + '44' },

  // Bottom
  bottomZone: { paddingHorizontal: 24, paddingBottom: 8, gap: 8 },
  cta:        { borderRadius: 16, overflow: 'hidden' },
  ctaGrad:    { paddingVertical: 18, alignItems: 'center' },
  ctaText:    { color: '#000', fontWeight: '800', fontSize: 14, letterSpacing: 2 },
  tapHint:    { alignItems: 'center', paddingVertical: 14 },
  tapHintText:{ color: C.dim, fontSize: 11, letterSpacing: 1 },
});
