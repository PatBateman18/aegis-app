// components/LevelUpModal.tsx
import { useEffect, useRef } from 'react';
import {
  View, Text, Modal, StyleSheet, TouchableOpacity,
  Animated, Easing, Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { C } from '@/constants/colors';
import { type Rank } from '@/constants/rpg';

const { width, height } = Dimensions.get('window');

// ─── Noms de rangs féminins ───────────────────────────────────────────────────
const FEMALE_RANK_NAMES: Record<string, string> = {
  'INITIÉ':     'INITIÉE',
  'GUERRIER':   'GUERRIÈRE',
  'CONQUÉRANT': 'CONQUÉRANTE',
  'CHAMPION':   'CHAMPIONNE',
  'MAÎTRE':     'MAÎTRESSE',
};

// ─── Contenu par rang (affiché quand on entre dans un nouveau rang) ───────────
const RANK_CONTENT: Record<string, { tagline: string; quote: string }> = {
  'NOVICE':     { tagline: 'Le voyage commence ici.',          quote: '"Chaque légende a commencé au niveau 1."' },
  'INITIÉ':     { tagline: 'La discipline prend racine.',      quote: '"Chaque maître a été un débutant."' },
  'DISCIPLE':   { tagline: 'La discipline devient identité.',  quote: '"Ce que tu répètes, tu le deviens."' },
  'GUERRIER':   { tagline: 'Tu as prouvé ta constance.',       quote: '"La bataille se gagne avant d\'être livrée."' },
  'STRATÈGE':   { tagline: "L'esprit guide le corps.",         quote: '"Celle qui pense gagne avant d\'agir."' },
  'CONQUÉRANT': { tagline: 'Rien ne te résiste.',              quote: '"Il n\'attend pas. Il avance."' },
  'CHAMPION':   { tagline: 'Tu inspires sans le savoir.',      quote: '"Le champion est fait de défaites surmontées."' },
  'MAÎTRE':     { tagline: 'La maîtrise est ton standard.',    quote: '"La perfection n\'est pas un but. C\'est une habitude."' },
  'ÉLITE':      { tagline: 'Tu appartiens au sommet.',         quote: '"Peu arrivent ici. Tu y es."' },
  'AEGIS':      { tagline: 'Tu es devenu la légende.',         quote: '"La légende ne se raconte pas. Elle se vit."' },
};

const RANK_CONTENT_FEMALE: Record<string, { tagline: string; quote: string }> = {
  'NOVICE':     { tagline: 'Le voyage commence ici.',          quote: '"Chaque légende a commencé au niveau 1."' },
  'INITIÉ':     { tagline: 'La discipline prend racine.',      quote: '"Chaque maîtresse a été une débutante."' },
  'DISCIPLE':   { tagline: 'La discipline devient identité.',  quote: '"Ce que tu répètes, tu le deviens."' },
  'GUERRIER':   { tagline: 'Tu as prouvé ta constance.',       quote: '"La bataille se gagne avant d\'être livrée."' },
  'STRATÈGE':   { tagline: "L'esprit guide le corps.",         quote: '"Celle qui pense gagne avant d\'agir."' },
  'CONQUÉRANT': { tagline: 'Rien ne te résiste.',              quote: '"Elle n\'attend pas. Elle avance."' },
  'CHAMPION':   { tagline: 'Tu inspires sans le savoir.',      quote: '"La championne est faite de défaites surmontées."' },
  'MAÎTRE':     { tagline: 'La maîtrise est ton standard.',    quote: '"La perfection n\'est pas un but. C\'est une habitude."' },
  'ÉLITE':      { tagline: 'Tu appartiens au sommet.',         quote: '"Peu arrivent ici. Tu y es."' },
  'AEGIS':      { tagline: 'Tu es devenue la légende.',        quote: '"La légende ne se raconte pas. Elle se vit."' },
};

// ─── Messages de level up dans un même rang ───────────────────────────────────
const LEVEL_MESSAGES: { tagline: string; quote: string }[] = [
  { tagline: 'Un pas de plus.',              quote: '"La progression est une promesse tenue."' },
  { tagline: 'La constance paye.',           quote: '"Petit à petit, l\'oiseau fait son nid."' },
  { tagline: 'Tu avances.',                  quote: '"Chaque jour compte."' },
  { tagline: 'La routine forge l\'acier.',   quote: '"Discipline maintenant. Liberté demain."' },
  { tagline: 'Le travail silencieux paie.',  quote: '"Ce que tu fais quand personne ne regarde."' },
  { tagline: 'Encore un niveau.',            quote: '"L\'excellence est une habitude."' },
  { tagline: 'Tu ne t\'arrêtes pas.',        quote: '"Un jour de plus. Une victoire de plus."' },
  { tagline: 'La progression continue.',     quote: '"Le chemin est la destination."' },
  { tagline: 'Tu construis quelque chose.', quote: '"L\'empire se construit dans l\'obscurité."' },
  { tagline: 'Le meilleur reste à venir.',   quote: '"Chaque niveau te rapproche d\'AEGIS."' },
];

// ─── Particule dorée ──────────────────────────────────────────────────────────
function GlowParticle({ x, delay }: { x: number; delay: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  const size = 2 + Math.random() * 4;
  const drift = (Math.random() - 0.5) * 80;
  const color = Math.random() > 0.5 ? C.goldBright : C.gold;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {
          toValue: 1,
          duration: 2500 + Math.random() * 1500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View style={{
      position: 'absolute',
      bottom: height * 0.15,
      left: x,
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: color,
      opacity: anim.interpolate({ inputRange: [0, 0.1, 0.85, 1], outputRange: [0, 1, 0.5, 0] }),
      transform: [
        { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -height * 0.7] }) },
        { translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [0, drift] }) },
      ],
    }} />
  );
}

// ─── Modal principal ──────────────────────────────────────────────────────────
type Props = { rank: Rank | null; onClose: () => void; gender?: string };

export default function LevelUpModal({ rank, onClose, gender = 'male' }: Props) {
  const visible = !!rank;

  const bgOpacity   = useRef(new Animated.Value(0)).current;
  const rankScale   = useRef(new Animated.Value(0.55)).current;
  const rankOpacity = useRef(new Animated.Value(0)).current;
  const lineWidth   = useRef(new Animated.Value(0)).current;
  const taglineAnim = useRef(new Animated.Value(0)).current;
  const quoteAnim   = useRef(new Animated.Value(0)).current;
  const glowAnim    = useRef(new Animated.Value(0)).current;
  const btnAnim     = useRef(new Animated.Value(0)).current;
  const levelAnim   = useRef(new Animated.Value(0)).current;

  const particles = useRef(
    Array.from({ length: 28 }, (_, i) => ({
      id: i,
      x: Math.random() * width,
      delay: Math.random() * 2500,
    }))
  ).current;

  useEffect(() => {
    if (!visible || !rank) return;

    [bgOpacity, rankScale, rankOpacity, lineWidth, taglineAnim, quoteAnim, glowAnim, btnAnim, levelAnim]
      .forEach(a => a.setValue(0));
    rankScale.setValue(0.55);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 700);

   Animated.sequence([
  Animated.timing(bgOpacity,   { toValue: 1, duration: 300, useNativeDriver: true }),
  Animated.delay(100),
  Animated.timing(levelAnim,   { toValue: 1, duration: 300, easing: Easing.out(Easing.quad), useNativeDriver: true }),
  Animated.delay(80),
  Animated.parallel([
    Animated.timing(rankOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    Animated.spring(rankScale,   { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
    Animated.timing(glowAnim,    { toValue: 1, duration: 600, useNativeDriver: true }),
  ]),
  Animated.timing(lineWidth,   { toValue: 1, duration: 600, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }),
  Animated.timing(taglineAnim, { toValue: 1, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
  Animated.timing(quoteAnim,   { toValue: 1, duration: 350, easing: Easing.out(Easing.quad), useNativeDriver: true }),
  Animated.spring(btnAnim,     { toValue: 1, tension: 80, friction: 10, useNativeDriver: true }),
]).start();
  }, [visible]);

  if (!rank) return null;

  const isFemale = gender === 'female';
  const rankContentMap = isFemale ? RANK_CONTENT_FEMALE : RANK_CONTENT;
  const displayName = isFemale ? (FEMALE_RANK_NAMES[rank.name] ?? rank.name) : rank.name;

  // Contenu : message de rang si premier niveau du rang, sinon message rotatif
  const isRankEntry = rank.level % 10 === 1 || rank.level === 1 || rank.level === 100;
  const content = isRankEntry
    ? (rankContentMap[rank.name] ?? { tagline: 'Nouveau rang atteint.', quote: '"Continue."' })
    : LEVEL_MESSAGES[(rank.level - 1) % LEVEL_MESSAGES.length];
  const lineW   = lineWidth.interpolate({ inputRange: [0, 1], outputRange: ['0%', '65%'] });

  return (
    <Modal visible={visible} transparent statusBarTranslucent animationType="none">
      <Animated.View style={[styles.overlay, { opacity: bgOpacity }]}>

        {/* Particules dorées */}
        {particles.map(p => <GlowParticle key={p.id} x={p.x} delay={p.delay} />)}

        <View style={styles.center}>

          {/* Surtitle */}
          <Animated.Text style={[
            styles.surtitle,
            {
              opacity: levelAnim,
              transform: [{ translateY: levelAnim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
            },
          ]}>
            NIVEAU SUPÉRIEUR
          </Animated.Text>

          {/* Nom du rang — titre brillant */}
          <Animated.Text
            adjustsFontSizeToFit
            numberOfLines={1}
            style={[
              styles.rankName,
              displayName.length > 7 ? { fontSize: 40, letterSpacing: 2 } :
              displayName.length > 5 ? { fontSize: 50, letterSpacing: 4 } : {},
              { opacity: rankOpacity, transform: [{ scale: rankScale }] },
            ]}>
            {displayName}
          </Animated.Text>

          {/* Niveau */}
          <Animated.Text style={[styles.levelText, { opacity: rankOpacity }]}>
            NIVEAU {rank.level}
          </Animated.Text>

          {/* Ligne */}
          <View style={styles.lineContainer}>
            <Animated.View style={[styles.line, { width: lineW }]} />
          </View>

          {/* Tagline */}
          <Animated.Text style={[
            styles.tagline,
            {
              opacity: taglineAnim,
              transform: [{ translateY: taglineAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
            },
          ]}>
            {content.tagline}
          </Animated.Text>

          {/* Citation */}
          <Animated.Text style={[
            styles.quote,
            {
              opacity: quoteAnim,
              transform: [{ translateY: quoteAnim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
            },
          ]}>
            {content.quote}
          </Animated.Text>

          {/* Bouton */}
          <Animated.View style={{
            opacity: btnAnim,
            transform: [{ scale: btnAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }],
            marginTop: 44,
          }}>
            <TouchableOpacity style={styles.btn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.btnText}>CONTINUER</Text>
            </TouchableOpacity>
          </Animated.View>

        </View>
      </Animated.View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#020100',
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  surtitle: {
    fontSize: 10,
    letterSpacing: 6,
    color: '#444',
    textTransform: 'uppercase',
    marginBottom: 28,
  },
  rankName: {
    fontFamily: 'Cinzel',
    fontSize: 58,
    letterSpacing: 5,
    textAlign: 'center',
    color: C.goldBright,
    marginBottom: 8,
    textShadowColor: C.gold,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 24,
  },
  levelText: {
    fontSize: 10,
    letterSpacing: 5,
    color: C.gold + '55',
    marginBottom: 28,
    marginTop: 4,
  },
  lineContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
  },
  line: {
    height: 1,
    backgroundColor: C.gold,
    opacity: 0.4,
  },
  tagline: {
    fontSize: 17,
    color: C.dim,
    fontStyle: 'italic',
    textAlign: 'center',
    letterSpacing: 0.3,
    lineHeight: 26,
    marginBottom: 12,
  },
  quote: {
    fontSize: 12,
    color: '#383530',
    textAlign: 'center',
    letterSpacing: 0.3,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  btn: {
    borderWidth: 1,
    borderColor: C.goldDim,
    borderRadius: 14,
    paddingHorizontal: 44,
    paddingVertical: 16,
    backgroundColor: C.goldDim + '44',
  },
  btnText: {
    fontFamily: 'Cinzel',
    fontSize: 13,
    letterSpacing: 3,
    color: C.gold,
  },
});
