import React, { useEffect, useRef, createContext, useContext } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Switch, Animated, Easing } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { C } from '@/constants/colors';

// ── ACCENT CONTEXT ────────────────────────────
// Chaque page wrap son contenu dans <AccentProvider color={ACC}>.
// Tous les composants lisent l'accent automatiquement — aucune prop à passer.
const AccentContext = createContext(C.gold);

export function AccentProvider({ color, children }: { color: string; children: React.ReactNode }) {
  return <AccentContext.Provider value={color}>{children}</AccentContext.Provider>;
}

function useAccent() {
  return useContext(AccentContext);
}

// ── CARD ─────────────────────────────────────
export function Card({ children, style }: any) {
  return <View style={[styles.card, style]}>{children}</View>;
}

// ── SECTION TITLE ─────────────────────────────
export function SectionTitle({ children }: { children: string }) {
  const acc = useAccent();
  return (
    <View style={styles.sectionRow}>
      <View style={[styles.sectionBar, { backgroundColor: acc }]} />
      <Text style={[styles.sectionText, { color: acc }]}>{children}</Text>
    </View>
  );
}

// ── TOGGLE ROW ────────────────────────────────
export function ToggleRow({
  label, sub, value, onChange, color,
}: { label: string; sub?: string; value: boolean; onChange: (v: boolean) => void; color?: string }) {
  const acc = useAccent();
  const c = color ?? acc;
  return (
    <View style={styles.toggleRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {sub && <Text style={styles.toggleSub}>{sub}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: C.s3, true: c }}
        thumbColor={value ? '#000' : C.dim}
        ios_backgroundColor={C.s3}
      />
    </View>
  );
}

// ── INPUT ─────────────────────────────────────
export function Inp({
  label, value, onChange, placeholder = '', keyboardType = 'default', unit, multiline = false,
}: any) {
  return (
    <View style={{ marginBottom: 14 }}>
      {label && <Text style={styles.inputLabel}>{label}</Text>}
      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, multiline && { height: 90, textAlignVertical: 'top' }]}
          value={value || ''}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={C.dim}
          keyboardType={keyboardType}
          multiline={multiline}
        />
        {unit && <Text style={styles.inputUnit}>{unit}</Text>}
      </View>
    </View>
  );
}

// ── SCORE RING animé ──────────────────────────
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function ScoreRing({ score, size = 88 }: { score: number; size?: number }) {
  const acc    = useAccent();
  const r      = size / 2 - 9;
  const circ   = 2 * Math.PI * r;
  const color  = score >= 80 ? C.green : score >= 50 ? acc : C.red;

  const animProgress = useRef(new Animated.Value(0)).current;
  const textScale    = useRef(new Animated.Value(1)).current;
  const prevScore    = useRef(-1);

  useEffect(() => {
    Animated.timing(animProgress, {
      toValue: score / 100,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    if (prevScore.current !== -1 && prevScore.current !== score) {
      textScale.setValue(0.85);
      Animated.spring(textScale, {
        toValue: 1,
        tension: 120,
        friction: 10,
        useNativeDriver: true,
      }).start();
    }
    prevScore.current = score;
  }, [score]);

  const strokeDashoffset = animProgress.interpolate({
    inputRange:  [0, 1],
    outputRange: [circ, 0],
  });

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={C.s3} strokeWidth={6}
        />
        <AnimatedCircle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeDasharray={circ}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
      <View style={{ position: 'absolute', width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
        <Animated.Text style={{ color, fontSize: 16, fontWeight: '700', transform: [{ scale: textScale }] }}>
          {score}%
        </Animated.Text>
      </View>
    </View>
  );
}

// ── CHIP SELECT ───────────────────────────────
export function ChipSelect({
  options, value, onChange,
}: { options: string[]; value: string; onChange: (v: string) => void }) {
  const acc = useAccent();
  return (
    <View style={styles.chipGrid}>
      {options.map(o => {
        const active = value === o;
        return (
          <TouchableOpacity
            key={o}
            style={[
              styles.chip,
              active && { backgroundColor: acc + '22', borderColor: acc },
            ]}
            onPress={() => onChange(o)}
          >
            <Text style={[styles.chipText, active && { color: acc }]}>{o}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}


// ── ACTION ROW ────────────────────────────────
// Ligne habitude/action style Liftoff — utilise AccentProvider
// 3 couches séparées par driver (même règle que HabitRow dans index.tsx)
export function ActionRow({
  icon, label, sub, xp, active, onPress, color,
}: {
  icon: string; label: string; sub?: string;
  xp?: number; active: boolean;
  onPress: (v: boolean) => void; color?: string;
}) {
  const acc = color ?? useAccent();

  const scale        = useRef(new Animated.Value(1)).current;
  const glowAnim     = useRef(new Animated.Value(active ? 1 : 0)).current;
  const checkScale   = useRef(new Animated.Value(active ? 1 : 0)).current;
  const checkOpacity = useRef(new Animated.Value(active ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(glowAnim,     { toValue: active ? 1 : 0, duration: 220, useNativeDriver: false }).start();
    Animated.spring(checkScale,   { toValue: active ? 1 : 0, tension: 200, friction: 10, useNativeDriver: true }).start();
    Animated.spring(checkOpacity, { toValue: active ? 1 : 0, tension: 200, friction: 10, useNativeDriver: true }).start();
  }, [active]);

  function handlePress() {
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.97, tension: 400, friction: 10, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1,    tension: 200, friction: 8,  useNativeDriver: true }),
    ]).start();
    onPress(!active);
  }

  const bgColor     = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [C.s2, acc + '14'] });
  const borderColor = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [C.s3, acc + '66'] });
  const iconBg      = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [C.s3, acc + '33'] });

  return (
    <Animated.View style={{ transform: [{ scale }], marginBottom: 8 }}>
      <TouchableOpacity onPress={handlePress} activeOpacity={1}>
        <Animated.View style={{
          flexDirection: 'row', alignItems: 'center',
          paddingHorizontal: 14, paddingVertical: 12,
          borderRadius: 14, borderWidth: 1,
          backgroundColor: bgColor, borderColor, gap: 14,
        }}>
          {/* Icône — JS driver */}
          <Animated.View style={{
            width: 40, height: 40, borderRadius: 12,
            backgroundColor: iconBg,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ fontSize: 18, color: active ? acc : C.dim }}>{icon}</Text>
          </Animated.View>

          {/* Texte */}
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, color: active ? C.text : C.dim, fontWeight: active ? '600' : '400' }}>
              {label}
            </Text>
            {(sub || xp !== undefined) && (
              <Text style={{ fontSize: 10, color: active ? acc : C.s3, marginTop: 2 }}>
                {sub ?? `+${xp} XP`}
              </Text>
            )}
          </View>

          {/* Checkbox — native driver */}
          <View style={{
            width: 26, height: 26, borderRadius: 13, borderWidth: 2,
            borderColor: active ? acc : C.s3,
            backgroundColor: active ? acc : 'transparent',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Animated.Text style={{
              color: '#000', fontSize: 13, fontWeight: '800',
              opacity: checkOpacity,
              transform: [{ scale: checkScale.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 1.4, 1] }) }],
            }}>✓</Animated.Text>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── PROGRESS BAR ──────────────────────────────
export function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const width = `${Math.min((value / max) * 100, 100)}%`;
  return (
    <View style={styles.progBg}>
      <View style={[styles.progFill, { width: width as any, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  card:        { backgroundColor: C.s1, borderWidth: 1, borderColor: C.s3, borderRadius: 14, padding: 18, marginBottom: 14 },
  sectionRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14, marginTop: 6 },
  sectionBar:  { width: 3, height: 14, borderRadius: 2 },
  sectionText: { fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', fontWeight: '700' },
  toggleRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: C.s3 },
  toggleLabel: { fontSize: 14, color: C.text },
  toggleSub:   { fontSize: 11, color: C.dim, marginTop: 2 },
  inputLabel:  { fontSize: 10, color: C.dim, marginBottom: 6, letterSpacing: 2, textTransform: 'uppercase' },
  inputRow:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input:       { flex: 1, backgroundColor: C.s2, borderWidth: 1, borderColor: C.s3, borderRadius: 8, padding: 12, color: C.text, fontSize: 15 },
  inputUnit:   { color: C.dim, fontSize: 12, minWidth: 30 },
  chipGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:        { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: C.s2, borderWidth: 1, borderColor: C.s3 },
  chipText:    { fontSize: 12, color: C.dim },
  progBg:      { height: 4, backgroundColor: C.s3, borderRadius: 4, overflow: 'hidden' },
  progFill:    { height: '100%', borderRadius: 4 },
});
