// components/QuoteCard.tsx
import { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, TouchableOpacity } from 'react-native';
import { C } from '@/constants/colors';
import { type Quote } from '@/constants/quotes';

type Props = {
  quote: Quote;
  onPress?: () => void;
  accentColor?: string;
};

export default function QuoteCard({ quote, onPress, accentColor }: Props) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(6)).current;

  useEffect(() => {
    // Reset puis anime à chaque changement de citation
    fadeAnim.setValue(0);
    slideAnim.setValue(6);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [quote.text]);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      <Animated.View style={[
        styles.card,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        accentColor ? { borderLeftColor: accentColor } : {},
      ]}>
        {/* Guillemet décoratif */}
        <Text style={[styles.openQuote, accentColor ? { color: accentColor } : {}]}>❝</Text>

        {/* Texte de la citation */}
        <Text style={styles.quoteText}>{quote.text}</Text>

        {/* Ligne + auteur */}
        <View style={styles.footer}>
          <View style={[styles.line, accentColor ? { backgroundColor: accentColor } : {}]} />
          {quote.author && (
            <Text style={styles.author}>— {quote.author}</Text>
          )}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.s1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.s3,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 16,
    marginBottom: 14,
  },
  openQuote: {
    fontFamily: 'Cinzel',
    fontSize: 28,
    color: C.goldDim,
    lineHeight: 30,
    marginBottom: 6,
  },
  quoteText: {
    fontSize: 14,
    color: C.text,
    lineHeight: 22,
    letterSpacing: 0.2,
    fontStyle: 'italic',
  },
  footer: {
    marginTop: 14,
    gap: 8,
  },
  line: {
    height: 1,
    backgroundColor: C.goldDim,
    opacity: 0.5,
    width: 40,
  },
  author: {
    fontSize: 10,
    color: C.dim,
    letterSpacing: 1,
  },
});
