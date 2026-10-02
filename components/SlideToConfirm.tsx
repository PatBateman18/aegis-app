// components/SlideToConfirm.tsx
// Bouton "glisse pour valider" façon Apple (ex: slide to unlock / slide to pay).
// Remplace un bouton tap classique pour l'action finale du paywall — geste
// intentionnel qui évite les achats accidentels et renforce le côté "rituel".

import { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, PanResponder, StyleSheet, ActivityIndicator } from 'react-native';
import { C } from '@/constants/colors';

const GOLD = C.gold;
const THUMB_SIZE = 50;
const TRACK_PADDING = 5;

type Props = {
  label: string;
  subLabel?: string;
  disabled?: boolean;
  loading?: boolean;
  onConfirm: () => void;
};

export default function SlideToConfirm({ label, subLabel, disabled, loading, onConfirm }: Props) {
  const translateX = useRef(new Animated.Value(0)).current;
  const maxTranslateRef = useRef(0);
  const [trackWidth, setTrackWidth] = useState(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled && !loading,
      onMoveShouldSetPanResponder: () => !disabled && !loading,
      onPanResponderMove: (_, gesture) => {
        const max = maxTranslateRef.current;
        const next = Math.min(Math.max(gesture.dx, 0), max);
        translateX.setValue(next);
      },
      onPanResponderRelease: (_, gesture) => {
        const max = maxTranslateRef.current;
        if (max > 0 && gesture.dx >= max * 0.75) {
          Animated.timing(translateX, {
            toValue: max,
            duration: 120,
            useNativeDriver: true,
          }).start(() => onConfirm());
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            friction: 7,
          }).start();
        }
      },
    })
  ).current;

  // Reset visuel si un achat échoue (loading repasse à false sans succès,
  // le modal reste ouvert dans ce cas donc il faut faire revenir le curseur).
  useEffect(() => {
    if (!loading) {
      Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
    }
  }, [loading]);

  function handleLayout(e: any) {
    const w = e.nativeEvent.layout.width;
    setTrackWidth(w);
    maxTranslateRef.current = Math.max(w - THUMB_SIZE - TRACK_PADDING * 2, 0);
  }

  const labelOpacity = translateX.interpolate({
    inputRange: [0, 160],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View
      style={[styles.track, disabled && styles.trackDisabled]}
      onLayout={handleLayout}
    >
      <Animated.View style={[styles.labelWrap, { opacity: labelOpacity }]} pointerEvents="none">
        <Text style={styles.label}>{label}</Text>
        {subLabel ? <Text style={styles.subLabel}>{subLabel}</Text> : null}
      </Animated.View>

      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.thumb,
          { transform: [{ translateX }] },
        ]}
      >
        {loading ? (
          <ActivityIndicator color="#000" size="small" />
        ) : (
          <Text style={styles.thumbArrow}>»</Text>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    height: THUMB_SIZE + TRACK_PADDING * 2,
    borderRadius: (THUMB_SIZE + TRACK_PADDING * 2) / 2,
    backgroundColor: '#0A0A0A',
    borderWidth: 1,
    borderColor: GOLD + '55',
    justifyContent: 'center',
    padding: TRACK_PADDING,
    overflow: 'hidden',
  },
  trackDisabled: { opacity: 0.5 },
  labelWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  label: {
    color: GOLD,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  subLabel: {
    color: C.dim,
    fontSize: 10,
    marginTop: 2,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbArrow: {
    color: '#000',
    fontSize: 20,
    fontWeight: '700',
  },
});
