// components/InactivityBanner.tsx
// Banner KRIOS affiché sur l'accueil quand l'utilisateur est inactif
import { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const GOLD = '#C9A84C';
const RED  = '#FF4444';

type Props = {
  message: string;
  daysInactive: number;
  isInDanger: boolean;
  onDismiss: () => void;
};

export default function InactivityBanner({ message, daysInactive, isInDanger, onDismiss }: Props) {
  const slideAnim = useRef(new Animated.Value(-120)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Slide in
    Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 12, useNativeDriver: true }).start();

    // Pulse si rang en danger
    if (isInDanger) {
      Animated.loop(Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 1000, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      ])).start();
    }
  }, []);

  const borderColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [RED + '66', RED],
  });

  const accentColor = isInDanger ? RED : GOLD;

  return (
    <Animated.View style={[s.wrap, { transform: [{ translateY: slideAnim }] }]}>
      <Animated.View style={[
        s.container,
        isInDanger && { borderColor },
        !isInDanger && { borderColor: GOLD + '44' },
      ]}>
        <LinearGradient
          colors={isInDanger
            ? ['rgba(40,4,4,0.97)', 'rgba(20,4,4,0.95)']
            : ['rgba(20,14,0,0.97)', 'rgba(10,8,0,0.95)']
          }
          style={StyleSheet.absoluteFillObject}
        />

        <View style={s.inner}>
          {/* Icône + jours */}
          <View style={[s.badge, { backgroundColor: accentColor + '22', borderColor: accentColor + '55' }]}>
            <Text style={{ fontSize: 18 }}>{isInDanger ? '✦' : '⚡'}</Text>
            <Text style={{ fontFamily: 'Cinzel', fontSize: 9, color: accentColor, marginTop: 2, letterSpacing: 1 }}>
              J+{daysInactive}
            </Text>
          </View>

          {/* Message KRIOS */}
          <View style={{ flex: 1, marginHorizontal: 12 }}>
            <Text style={{ fontFamily: 'Cinzel', fontSize: 8, color: accentColor, letterSpacing: 2, marginBottom: 5 }}>
              {isInDanger ? '⚠ RANG EN DANGER' : 'KRIOS'}
            </Text>
            <Text style={{ fontSize: 12, color: '#EAE0CC', lineHeight: 17 }}>
              {message}
            </Text>
          </View>

          {/* Bouton fermer */}
          <TouchableOpacity onPress={onDismiss} style={s.closeBtn}>
            <Text style={{ color: accentColor, fontSize: 13 }}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Bouton reprendre */}
        <TouchableOpacity onPress={onDismiss} style={[s.cta, { borderTopColor: accentColor + '33' }]}>
          <Text style={{ color: accentColor, fontSize: 11, fontWeight: '700', letterSpacing: 2 }}>
            {isInDanger ? 'REPRENDRE LE CONTRÔLE →' : 'CONTINUER LE VOYAGE →'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap: {
    marginHorizontal: 0,
    marginBottom: 16,
  },
  container: {
    borderWidth: 1.5,
    borderRadius: 16,
    overflow: 'hidden',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  badge: {
    width: 52, height: 52, borderRadius: 26,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  closeBtn: {
    width: 30, height: 30, alignItems: 'center', justifyContent: 'center',
  },
  cta: {
    borderTopWidth: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
});
