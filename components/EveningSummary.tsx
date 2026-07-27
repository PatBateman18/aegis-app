// components/EveningSummary.tsx
import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Easing } from 'react-native';
import { C } from '@/constants/colors';

type Props = {
  done: number;
  total: number;
  onDismiss: () => void;
};

export default function EveningSummary({ done, total, onDismiss }: Props) {
  const slideAnim = useRef(new Animated.Value(-120)).current;
  const opacAnim  = useRef(new Animated.Value(0)).current;

  const remaining = total - done;

  useEffect(() => {
    // Slide in
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, tension: 70, friction: 12, useNativeDriver: true }),
      Animated.timing(opacAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();

    // Auto-dismiss après 6s
    const t = setTimeout(dismiss, 6000);
    return () => clearTimeout(t);
  }, []);

  function dismiss() {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: -120, duration: 350, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      Animated.timing(opacAnim,  { toValue: 0,    duration: 300, useNativeDriver: true }),
    ]).start(onDismiss);
  }

  const getMessage = () => {
    if (done === total) return { emoji: '✦', text: 'Journée complète. Repos mérité.', sub: null };
    if (remaining === 1) return { emoji: '⚡', text: 'Plus qu\'une habitude à valider.', sub: `Il reste : ${remaining} habitude` };
    return { emoji: '☽', text: `${remaining} habitudes restantes ce soir.`, sub: `${done}/${total} validées aujourd'hui` };
  };

  const msg = getMessage();
  const isComplete = done === total;

  return (
    <Animated.View style={[
      styles.banner,
      { transform: [{ translateY: slideAnim }], opacity: opacAnim },
      isComplete && { borderColor: C.green + '66', backgroundColor: '#001a0d' },
    ]}>
      <Text style={styles.emoji}>{msg.emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, isComplete && { color: C.green }]}>{msg.text}</Text>
        {msg.sub && <Text style={styles.sub}>{msg.sub}</Text>}
      </View>

      {/* Barre de progression */}
      <View style={styles.progressCol}>
        <Text style={[styles.score, isComplete && { color: C.green }]}>
          {done}/{total}
        </Text>
        <View style={styles.progressBg}>
          <View style={[
            styles.progressFill,
            { width: `${(done / total) * 100}%` as any },
            isComplete && { backgroundColor: C.green },
          ]} />
        </View>
      </View>

      <TouchableOpacity onPress={dismiss} style={styles.closeBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 54,
    left: 16,
    right: 16,
    zIndex: 998,
    backgroundColor: '#0a0800',
    borderWidth: 1,
    borderColor: C.goldDim,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  emoji:    { fontSize: 20 },
  title:    { fontSize: 13, color: C.goldBright, fontWeight: '600', lineHeight: 18 },
  sub:      { fontSize: 10, color: C.dim, marginTop: 2 },
  progressCol: { alignItems: 'center', gap: 4 },
  score:    { fontFamily: 'SpaceMono', fontSize: 13, color: C.gold },
  progressBg: { width: 40, height: 3, backgroundColor: C.s3, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: C.gold, borderRadius: 2 },
  closeBtn: { padding: 4 },
  closeText:{ fontSize: 13, color: C.dim },
});
