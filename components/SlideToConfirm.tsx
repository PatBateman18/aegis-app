// components/SlideToConfirm.tsx
// Bouton "glisse pour valider" façon Apple (ex: slide to unlock / slide to pay).
// Remplace un bouton tap classique pour l'action finale du paywall — geste
// intentionnel qui évite les achats accidentels et renforce le côté "rituel".

import { useEffect, useMemo, useRef, useState } from 'react';
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

  // La flèche fait un petit va-et-vient pour suggérer le geste.
  // Stoppé quand le slider est désactivé ou pendant un achat.
  const nudge = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (disabled || loading) {
      nudge.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(nudge, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(nudge, { toValue: 0, duration: 650, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [disabled, loading]);
  const arrowShift = nudge.interpolate({ inputRange: [0, 1], outputRange: [-2, 3] });

  // Le PanResponder n'est créé qu'une seule fois : sans ces refs, il garderait
  // les valeurs de disabled/loading/onConfirm du tout premier rendu.
  const disabledRef = useRef(disabled);
  const loadingRef = useRef(loading);
  const onConfirmRef = useRef(onConfirm);
  disabledRef.current = disabled;
  loadingRef.current = loading;
  onConfirmRef.current = onConfirm;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabledRef.current && !loadingRef.current,
      onMoveShouldSetPanResponder: () => !disabledRef.current && !loadingRef.current,
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
          }).start(() => {
            onConfirmRef.current();
            // Si aucun achat ne démarre (mode test, erreur immédiate),
            // le curseur revient tout seul au départ.
            setTimeout(() => {
              Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
            }, 700);
          });
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

  const fillTranslate = useMemo(() => {
    if (trackWidth <= 0) return null;
    const max = Math.max(trackWidth - THUMB_SIZE - TRACK_PADDING * 2, 1);
    const start = -trackWidth;
    return translateX.interpolate({
      inputRange: [0, max],
      outputRange: [start, start + max + TRACK_PADDING + THUMB_SIZE],
      extrapolate: 'clamp',
    });
  }, [trackWidth]);

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
      {fillTranslate && (
        <Animated.View
          pointerEvents="none"
          style={[styles.fill, { width: trackWidth, transform: [{ translateX: fillTranslate }] }]}
        />
      )}

      <Animated.View style={[styles.labelWrap, { opacity: labelOpacity }]} pointerEvents="none">
        <Text style={styles.label} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
          {label}
        </Text>
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
          <Animated.Text style={[styles.thumbArrow, { transform: [{ translateX: arrowShift }] }]}>
            »
          </Animated.Text>
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
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: GOLD + '33',
  },
  // Le texte est centré dans l'espace à droite du curseur (il ne passe plus dessous).
  labelWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingLeft: THUMB_SIZE + TRACK_PADDING * 2,
    paddingRight: 14,
    alignItems: 'center',
  },
  label: {
    color: GOLD,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
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
    shadowColor: GOLD,
    shadowOpacity: 0.6,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  thumbArrow: {
    color: '#000',
    fontSize: 20,
    fontWeight: '700',
  },
});
