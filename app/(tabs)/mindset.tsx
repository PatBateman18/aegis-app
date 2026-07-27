import { useRef, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Animated, Easing } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useFocusEffect } from '@react-navigation/native';
import { useAmbientSound } from '@/hooks/useAmbientSound';
import { useDay } from '@/hooks/useDay';
import { C } from '@/constants/colors';
import { calcScore } from '@/constants/types';
import * as Haptics from 'expo-haptics';
import { getDailyQuote } from '@/constants/quotes';

const { width, height } = Dimensions.get('window');
const BLUE  = '#4A9EFF';
const BLUEB = '#7BB8FF';
const BLUED = '#4A9EFF22';
const HERO_IMG = require('@/assets/hero/hero_mindset.png');
const BG_IMG   = require('@/assets/hero/bg_mindset.png');

// Habitudes mentales — mappées sur les clés existantes
const MENTAL_HABITS = [
  { key: 'workout_done',  label: 'MÉDITATION',      icon: require('@/assets/ui/icone_mindset_meditation.png'),      color: BLUE, iconScale: 1.9 },
  { key: 'learning_done', label: 'JOURNAL',          icon: require('@/assets/ui/icone_mindset_journal.png'),         color: BLUE, iconScale: 1.9, iconOffsetY: 2 },
  { key: 'calories_ok',   label: 'LECTURE',          icon: require('@/assets/ui/icone_mindset_lecture_habitude.png'), color: BLUE, iconScale: 1.9 },
  { key: 'm_face',        label: 'VISUALISATION',    icon: require('@/assets/ui/icone_mindset_visualisation.png'),   color: BLUE, iconScale: 1, iconOffsetX: 0, iconOffsetY: 2 },
  { key: 'outfit_ok',     label: 'RÉFLEXION',        icon: require('@/assets/ui/icone_mindset_reflexion.png'),       color: BLUE, iconScale: 1 },
  { key: 'morning_water', label: 'DÉTOX DIGITAL',    icon: require('@/assets/ui/icone_mindset_detox.png'),           color: BLUE, iconScale: 1, iconOffsetX: -2, iconOffsetY: 2 },
];

const ORB = 72;

// ─── HabitOrb mental ──────────────────────────────────────────────────────────
function MentalOrb({ label, icon, active, onPress, color, iconScale = 0.5, iconOffsetX = 0, iconOffsetY = 0 }: {
  label: string; icon: any; active: boolean; onPress: () => void; color: string; iconScale?: number; iconOffsetX?: number; iconOffsetY?: number;
}) {
  const scale    = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(active ? 1 : 0)).current;
  const checkAnim = useRef(new Animated.Value(active ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(glowAnim,  { toValue: active ? 1 : 0, duration: 250, useNativeDriver: false }).start();
    Animated.spring(checkAnim, { toValue: active ? 1 : 0, tension: 200, friction: 8, useNativeDriver: true }).start();
  }, [active]);

  function handlePress() {
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.84, tension: 400, friction: 8, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1,    tension: 200, friction: 8, useNativeDriver: true }),
    ]).start();
    Haptics.impactAsync(!active ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }

  const borderCol = glowAnim.interpolate({ inputRange: [0,1], outputRange: ['#1a2030', color] });
  const bgCol     = glowAnim.interpolate({ inputRange: [0,1], outputRange: ['rgba(0,0,0,0)', color + '18'] });

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={1} style={{ alignItems: 'center', width: ORB + 18 }}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Animated.View style={{
          width: ORB, height: ORB, borderRadius: ORB / 2,
          borderWidth: active ? 2 : 1.5,
          borderColor: borderCol, backgroundColor: bgCol,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Image source={icon} style={{ width: ORB * iconScale, height: ORB * iconScale, transform: [{ translateX: iconOffsetX }, { translateY: iconOffsetY }] }} resizeMode="contain" />
          {active && (
            <Animated.View style={{
              position: 'absolute', bottom: -2, right: -2,
              width: 18, height: 18, borderRadius: 9,
              backgroundColor: color, alignItems: 'center', justifyContent: 'center',
              opacity: checkAnim, transform: [{ scale: checkAnim }],
            }}>
              <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>✓</Text>
            </Animated.View>
          )}
        </Animated.View>
      </Animated.View>
      <Text style={{ fontSize: 8, marginTop: 7, color: active ? color : C.dim, letterSpacing: 0.5, fontWeight: active ? '700' : '400', textAlign: 'center' }}>
        {label}
      </Text>
      <Text style={{ fontSize: 8, color: active ? C.green : C.dim, marginTop: 1 }}>
        {active ? '1/1' : '0/1'}
      </Text>
    </TouchableOpacity>
  );
}

// ─── StatTile mental ──────────────────────────────────────────────────────────
function MentalStat({ icon, value, label, sub, color = BLUE }: {
  icon: any; value: string | number; label: string; sub: string; color?: string;
}) {
  return (
    <View style={{ flex: 1, backgroundColor: '#080A12', borderRadius: 14, paddingTop: 66, paddingBottom: 14, paddingHorizontal: 8, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' }}>
      <Image source={icon} style={{ position: 'absolute', top: -8, width: 80, height: 80 }} resizeMode="contain" />
      <Text style={{ fontFamily: 'SpaceMono', fontSize: 22, color: C.text, fontWeight: '700' }}>{value}</Text>
      <Text style={{ fontSize: 8, color, letterSpacing: 1, textTransform: 'uppercase', marginTop: 4, textAlign: 'center', fontWeight: '700' }}>{label}</Text>
      <Text style={{ fontSize: 9, color: C.dim, marginTop: 2, textAlign: 'center' }}>{sub}</Text>
      <View style={{ height: 2, backgroundColor: color, borderRadius: 1, width: '60%', marginTop: 8, opacity: 0.7 }} />
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function MindsetScreen() {
  const { user } = useAuth();
  const { playAmbient } = useAmbientSound();

  useFocusEffect(useCallback(() => {
    playAmbient('mindset');
  }, []));
  const { day, updateDay } = useDay(user?.id);
  const score = calcScore(day);
  const done  = MENTAL_HABITS.filter(h => !!(day as any)[h.key]).length;
  const scoreLabel = score >= 90 ? 'CONQUÉRANT' : score >= 70 ? 'DISCIPLINÉ' : score >= 40 ? 'EN MARCHE' : 'NOVICE';
  const quote = typeof getDailyQuote === 'function' ? getDailyQuote() : { text: 'Ne pense pas moins. Pense mieux.', author: '' };
  const heroScale = useRef(new Animated.Value(1)).current;
  const insets = useSafeAreaInsets();

  const stagger = useRef([0,1,2,3,4,5].map(() => new Animated.Value(0))).current;
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

  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(heroScale, { toValue: 1.03, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(heroScale, { toValue: 1,    duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#060810' }} edges={[]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }} keyboardShouldPersistTaps="handled">

        {/* ── HERO ── */}
        <View style={{ height: height * 0.54, position: 'relative', overflow: 'hidden' }}>
          <Animated.Image source={HERO_IMG} style={{ width: '100%', height: '100%', transform: [{ scale: heroScale }] }} resizeMode="cover" />
          <LinearGradient colors={['rgba(6,8,16,0.1)', 'transparent', 'rgba(6,8,16,0.65)', '#060810']} locations={[0, 0.3, 0.72, 1]} style={StyleSheet.absoluteFillObject} />
          <View style={{ position: 'absolute', top: insets.top + 12, left: 20, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ color: BLUE, fontSize: 10 }}>◈</Text>
            <Text style={{ fontSize: 10, color: BLUE, letterSpacing: 3, textTransform: 'uppercase', fontWeight: '700' }}>Discipline mentale</Text>
          </View>
          <View style={{ position: 'absolute', bottom: 24, left: 20, right: 20 }}>
            <Text style={{ fontFamily: 'Cinzel', fontSize: 48, color: C.text, fontWeight: '800', letterSpacing: 1, lineHeight: 52 }}>MINDSET</Text>
            <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', marginTop: 8, lineHeight: 22 }}>
              Ton esprit façonne ta réalité.{'\n'}Nourris-le chaque jour.
            </Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: 16 }}>

          {/* ── CITATION ── */}
          <Animated.View style={[S(0), { flexDirection: 'row', gap: 14, marginBottom: 20, paddingHorizontal: 4 }]}>
            <View style={{ width: 2, borderRadius: 1, backgroundColor: BLUE + '55' }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'Cinzel', fontSize: 20, color: BLUE, lineHeight: 20, marginBottom: 4 }}>❝</Text>
              <Text style={{ fontSize: 16, color: C.text, lineHeight: 23, fontWeight: '400', fontStyle: 'italic', marginBottom: 8 }}>
                Maîtrise ton esprit{'\n'}ou il te maîtrisera.
              </Text>
              <Text style={{ fontSize: 10, color: BLUE, letterSpacing: 2, fontWeight: '600' }}>— ÉPICTÈTE</Text>
            </View>
          </Animated.View>

          {/* ── FOCUS DU JOUR ── */}
          <Animated.View style={[S(2), { marginBottom: 12 }]}>
            <View style={{ borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: BLUE + '44' }}>
              <Image source={BG_IMG} style={{ position: 'absolute', width: '100%', height: '100%' }} resizeMode="cover" />
              <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(6,8,20,0.82)' }} />
              <View style={{ padding: 18 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Text style={{ fontSize: 11, color: BLUE, letterSpacing: 3, textTransform: 'uppercase', fontWeight: '700' }}>FOCUS DU JOUR</Text>
                </View>
                <TextInput
                  style={{ fontSize: 22, color: C.text, fontWeight: '700', marginBottom: 8 }}
                  value={day.focus || ''}
                  onChangeText={(v: string) => updateDay({ focus: v })}
                  placeholder="Clarté mentale"
                  placeholderTextColor="rgba(255,255,255,0.25)"
                />
                <TextInput
                  style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 20 }}
                  value={day.daily_goal || ''}
                  onChangeText={(v: string) => updateDay({ daily_goal: v })}
                  placeholder="Reste concentré sur l'essentiel. Élimine les distractions."
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  multiline
                />
              </View>
            </View>
          </Animated.View>

          {/* ── STAT TILES ── */}
          <Animated.View style={[S(3), { flexDirection: 'row', gap: 8, marginBottom: 12 }]}>
            <MentalStat icon={require('@/assets/ui/icone_mindset_clarte2.png')} value={score}       label="CLARTÉ"        sub="/100" />
            <MentalStat icon={require('@/assets/ui/icone_mindset_lecture2.png')} value={day.learning_done ? '1h' : '0h'} label="LECTURE"   sub="aujourd'hui" />
            <MentalStat icon={require('@/assets/ui/icone_mindset_habitude2.png')} value={done}         label="HABITUDES"     sub="validées" />
            <MentalStat icon={require('@/assets/ui/icone_mindset_discipline2.png')} value={`${score}%`}  label="DISCIPLINE"    sub="moyenne" />
          </Animated.View>

          {/* ── HABITUDES MENTALES ── */}
          <Animated.View style={[S(4), { marginBottom: 12 }]}>
            <View style={{ marginBottom: 14 }}>
              <Text style={{ fontSize: 11, color: BLUE, letterSpacing: 3, textTransform: 'uppercase', fontWeight: '700' }}>HABITUDES MENTALES</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 4, paddingHorizontal: 2 }}>
              {MENTAL_HABITS.map(h => (
                <MentalOrb
                  key={h.key}
                  icon={h.icon}
                  label={h.label}
                  color={h.color}
                  iconScale={(h as any).iconScale}
                  iconOffsetX={(h as any).iconOffsetX}
                  iconOffsetY={(h as any).iconOffsetY}
                  active={!!(day as any)[h.key]}
                  onPress={() => {
                    const v = !(day as any)[h.key];
                    Haptics.impactAsync(v ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
                    const updates: any = { [h.key]: v };
                    if (h.key === 'm_face') { updates.m_face = v; updates.m_hydra = v; updates.m_skin = v; updates.e_face = v; updates.e_hydra = v; updates.e_skin = v; }
                    updateDay(updates);
                  }}
                />
              ))}
            </ScrollView>
          </Animated.View>

          {/* ── PENSÉE DU JOUR ── */}
          <Animated.View style={[S(5), { marginBottom: 12 }]}>
            <View style={{ borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
              <Image source={BG_IMG} style={{ position: 'absolute', width: '100%', height: '100%' }} resizeMode="cover" />
              <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(6,8,20,0.88)' }} />
              <View style={{ padding: 18, flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                <View>
                  <Text style={{ fontSize: 9, color: BLUE, letterSpacing: 3, textTransform: 'uppercase', fontWeight: '700', marginBottom: 10 }}>PENSÉE DU JOUR</Text>
                  <Text style={{ fontFamily: 'Cinzel', fontSize: 22, color: BLUE, lineHeight: 22, marginBottom: 8 }}>❝</Text>
                  <Text style={{ fontSize: 15, color: C.text, lineHeight: 24, fontWeight: '500' }}>
                    Ne pense pas moins.{'\n'}Pense mieux.
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
