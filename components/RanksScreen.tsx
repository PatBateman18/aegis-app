// components/RanksScreen.tsx
import { useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity,
  StyleSheet, Dimensions, Animated, Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { C } from '@/constants/colors';
import { getRank, RANKS, calcTotalXP } from '@/constants/rpg';
import { useAuth } from '@/hooks/useAuth';
import { useDay } from '@/hooks/useDay';

const { width, height } = Dimensions.get('window');
const GOLD       = '#C9A84C';
const GOLDB      = '#E8C46A';
const PAD        = 16;
const CARD_W     = width;

// ─── Couleur bordure par rang — progression bronze → or → blanc divin ─────────
const RANK_BORDER: Record<string, string> = {
  'NOVICE':     '#8B6514',   // bronze sombre
  'INITIÉ':     '#A07824',   // bronze
  'DISCIPLE':   '#B89030',   // bronze doré
  'GUERRIER':   '#C9A84C',   // or
  'STRATÈGE':   '#D4B85A',   // or vif
  'CONQUÉRANT': '#E0C870',   // or brillant
  'CHAMPION':   '#EDD888',   // or clair
  'MAÎTRE':     '#F5EAB0',   // or blanc
  'ÉLITE':      '#FAF4D0',   // blanc nacré
  'AEGIS':      '#FFFFFF',   // blanc divin pur
};


const IMGS: Record<string, any> = {
  'NOVICE':     require('@/assets/ranks/rank_novice.png'),
  'INITIÉ':     require('@/assets/ranks/rank_initie.png'),
  'DISCIPLE':   require('@/assets/ranks/rank_disciple.png'),
  'GUERRIER':   require('@/assets/ranks/rank_guerrier.png'),
  'STRATÈGE':   require('@/assets/ranks/rank_stratege.png'),
  'CONQUÉRANT': require('@/assets/ranks/rank_conquerant.png'),
  'CHAMPION':   require('@/assets/ranks/rank_champion.png'),
  'MAÎTRE':     require('@/assets/ranks/rank_maitre.png'),
  'ÉLITE':      require('@/assets/ranks/rank_elite.png'),
  'AEGIS':      require('@/assets/ranks/rank_aegis.png'),
};

const PHRASES: Record<string, string> = {
  'NOVICE': 'Tout commence ici.',
  'INITIÉ': 'Le voyage commence.',
  'DISCIPLE': 'La discipline forge le caractère.',
  'GUERRIER': "Le corps et l'esprit s'alignent.",
  'STRATÈGE': 'Chaque plan, exécuté.',
  'CONQUÉRANT': 'Rien ne te résiste.',
  'CHAMPION': 'Tu inspires sans le savoir.',
  'MAÎTRE': 'La maîtrise est ton standard.',
  'ÉLITE': 'Tu appartiens au sommet.',
  'AEGIS': 'Tu es devenu la légende.',
};

const QUOTES: Record<string, string> = {
  'NOVICE': 'Chaque légende a commencé par un seul pas.',
  'INITIÉ': "Ce n'est pas ton potentiel qui compte, c'est ta régularité.",
  'DISCIPLE': "La discipline n'est pas une contrainte. C'est une liberté.",
  'GUERRIER': "La bataille se gagne avant d'être livrée.",
  'STRATÈGE': "Celui qui pense gagne avant d'agir.",
  'CONQUÉRANT': "Il n'attend pas. Il avance.",
  'CHAMPION': 'Le champion est fait de défaites surmontées.',
  'MAÎTRE': "La perfection n'est pas un but. C'est une habitude.",
  'ÉLITE': 'Peu arrivent ici. Tu y es.',
  'AEGIS': 'La légende ne se raconte pas. Elle se vit.',
};


// ─── Carte ────────────────────────────────────────────────────────────────────
function RankCard({ rank, isCurrent, isUnlocked, cardH, wasJustUnlocked }: {
  rank: typeof RANKS[0]; isCurrent: boolean; isUnlocked: boolean;
  cardH: number; wasJustUnlocked?: boolean;
}) {
  const borderCol = RANK_BORDER[rank.name] ?? GOLD;

  // Glow bordure pulsant sur la carte active — JS driver
  const glowAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!isCurrent) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(glowAnim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      Animated.timing(glowAnim, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [isCurrent]);

  // Animation déblocage — cadenas disparaît, image passe en couleur
  const unlockAnim   = useRef(new Animated.Value(wasJustUnlocked ? 0 : 1)).current;
  const lockScale    = useRef(new Animated.Value(1)).current;
  // lockOpacity : 1 par défaut (visible), 0 uniquement après animation de déblocage
  const lockOpacity  = useRef(new Animated.Value(wasJustUnlocked ? 1 : (isUnlocked ? 0 : 1))).current;

  useEffect(() => {
    if (!wasJustUnlocked) return;
    // Séquence : cadenas tremble → s'ouvre (scale up) → disparaît → couleur apparaît
    Animated.sequence([
      // Shake du cadenas
      Animated.sequence([
        Animated.timing(lockScale, { toValue: 1.2, duration: 100, useNativeDriver: true }),
        Animated.timing(lockScale, { toValue: 0.9, duration: 100, useNativeDriver: true }),
        Animated.timing(lockScale, { toValue: 1.3, duration: 100, useNativeDriver: true }),
        Animated.timing(lockScale, { toValue: 0.8, duration: 100, useNativeDriver: true }),
      ]),
      // Cadenas monte et disparaît
      Animated.parallel([
        Animated.timing(lockScale,   { toValue: 2,   duration: 400, useNativeDriver: true }),
        Animated.timing(lockOpacity, { toValue: 0,   duration: 400, useNativeDriver: true }),
      ]),
      // Image passe en couleur
      Animated.timing(unlockAnim, { toValue: 1, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
    ]).start();
  }, [wasJustUnlocked]);

  const borderOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });
  const shadowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.7] });

  // Noir et blanc → couleur via saturate simulé avec overlay
  const bwOverlay = unlockAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 0] });

  return (
    // Wrapper bordure — pas de overflow:hidden
    <Animated.View style={{
      width: CARD_W, height: cardH,
      borderRadius: 16,
      borderWidth: isCurrent ? 2 : 1,
      borderColor: isCurrent
        ? glowAnim.interpolate({ inputRange: [0,1], outputRange: [borderCol + '88', borderCol] })
        : isUnlocked ? borderCol + '44' : '#1a1a1a',
      shadowColor: borderCol,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: isCurrent ? shadowOpacity : 0,
      shadowRadius: isCurrent ? 20 : 0,
      elevation: isCurrent ? 12 : 0,
    }}>
      {/* Inner clip */}
      <View style={{ flex: 1, borderRadius: 14, overflow: 'hidden', backgroundColor: '#06040A' }}>

        {/* Image */}
        <Image
          source={IMGS[rank.name]}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          resizeMode="cover"
        />

        {/* Overlay noir et blanc si verrouillé — s'efface à l'unlock */}
        {!isUnlocked || wasJustUnlocked ? (
          <Animated.View style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: 'rgba(0,0,0,0)', opacity: bwOverlay },
          ]}>
            {/* Filtre N&B simulé : overlay gris semi-transparent */}
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#06040A', opacity: 0.0 }]} />
          </Animated.View>
        ) : null}

        {/* N&B réel : image dupliquée en grayscale via tintColor gris */}
        {!isUnlocked && !wasJustUnlocked && (
          <>
            <Image
              source={IMGS[rank.name]}
              style={[StyleSheet.absoluteFillObject, { tintColor: '#888', opacity: 0.6 }]}
              resizeMode="cover"
            />
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(10,8,12,0.5)' }]} />
          </>
        )}

        {/* Gradient bas */}
        <LinearGradient
          colors={['transparent', 'rgba(4,3,0,0.97)']}
          locations={[0.42, 1]}
          style={{ position: 'absolute', top: '38%', left: 0, right: 0, bottom: 0 }}
        />

        {/* Cadenas — visible si verrouillé, animé à l'unlock */}
        {(!isUnlocked || wasJustUnlocked) && (
          <Animated.View style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 80,
            alignItems: 'center', justifyContent: 'center',
            opacity: lockOpacity,
            transform: [{ scale: lockScale }],
          }}>
            <Text style={{ fontSize: 64 }}>🔒</Text>
          </Animated.View>
        )}

        {/* Texte bas */}
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: 22, alignItems: 'center' }}>
          <Text style={{
            fontFamily: 'Cinzel', fontSize: 18, letterSpacing: 3, textAlign: 'center', marginBottom: 6,
            color: isUnlocked ? (isCurrent ? borderCol : '#EAE0CC') : '#3a3530',
          }}>
            {rank.name}
          </Text>
          <Text style={{ fontSize: 12, textAlign: 'center', lineHeight: 17, paddingHorizontal: 20,
            color: isUnlocked ? '#8a8070' : '#2a2520' }}>
            {isUnlocked ? PHRASES[rank.name] : `${rank.minXP} XP requis`}
          </Text>
        </View>

      </View>
    </Animated.View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function RanksScreen({ onClose }: { onClose?: () => void }) {
  const insets   = useSafeAreaInsets();
  const { user } = useAuth();
  const { day, history } = useDay(user?.id);
  const allDays  = [...history.filter(h => h.date !== day.date), day];
  const totalXP  = calcTotalXP(allDays);
  const rank     = getRank(totalXP);
  const nextRank = RANKS.find(r => r.level === rank.level + 1);
  const xpToNext = nextRank ? nextRank.minXP - totalXP : 0;
  const progress = nextRank ? Math.min((totalXP - rank.minXP) / (nextRank.minXP - rank.minXP), 1) : 1;
  const scrollRef = useRef<ScrollView>(null);

  const headerH = insets.top + 52;
  const subH    = 38;
  const footerH = 86;
  const quoteH  = 54;
  const cardH   = height - headerH - subH - footerH - quoteH - 18;

  useEffect(() => {
    const idx = RANKS.findIndex(r => r.level === rank.level);
    if (idx > 0) setTimeout(() =>
      scrollRef.current?.scrollTo({ x: idx * CARD_W, animated: true }), 400);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>

      {/* Header */}
      <View style={{ paddingTop: insets.top + 4, paddingHorizontal: PAD, height: headerH }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <TouchableOpacity onPress={onClose} style={{
            width: 44, height: 44, borderRadius: 22,
            backgroundColor: GOLD + '18', borderWidth: 1, borderColor: GOLD + '44',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ color: GOLDB, fontSize: 26, lineHeight: 30 }}>‹</Text>
          </TouchableOpacity>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <Text style={{ color: GOLD, fontSize: 9 }}>✦</Text>
            <Text style={{ fontFamily: 'Cinzel', fontSize: 18, color: GOLDB, letterSpacing: 6 }}>RANG</Text>
            <Text style={{ color: GOLD, fontSize: 9 }}>✦</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>
      </View>

      {/* Sous-titre */}
      <Text style={{ fontSize: 12, color: C.dim, lineHeight: 16, paddingHorizontal: PAD, height: subH }}>
        Ton rang représente ton niveau de maîtrise, ta discipline et ton engagement quotidien.
      </Text>

      {/* Scroll cartes */}
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 0, gap: 0 }}
        snapToInterval={CARD_W}
        snapToAlignment="start"
        decelerationRate="fast"
        style={{ flexGrow: 0 }}
      >
        {RANKS.map((r, i) => (
          <RankCard
            key={r.level}
            rank={r}
            isCurrent={r.level === rank.level}
            isUnlocked={totalXP >= r.minXP}
            cardH={cardH}
          />
        ))}
      </ScrollView>

      {/* Footer */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 12,
        marginHorizontal: PAD, marginTop: 10,
        backgroundColor: C.s1, borderWidth: 1.5, borderColor: GOLD + '55',
        borderRadius: 16, padding: 14, height: footerH,
        shadowColor: GOLD, shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.12, shadowRadius: 8, elevation: 4,
      }}>
        <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: '#0A0800', borderWidth: 2, borderColor: GOLD, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: 'Cinzel', fontSize: 20, color: GOLD }}>{rank.level}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 8, color: '#555', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 5 }}>PROGRESSION ACTUELLE</Text>
          <View style={{ height: 3, backgroundColor: '#1a1a1a', borderRadius: 2, overflow: 'hidden', marginBottom: 5 }}>
            <View style={{ height: 3, backgroundColor: GOLD, borderRadius: 2, width: `${Math.round(progress * 100)}%` as any }} />
          </View>
          <Text style={{ fontFamily: 'SpaceMono', fontSize: 13, color: GOLDB }}>
            {totalXP.toLocaleString('fr-FR')} / {nextRank ? nextRank.minXP.toLocaleString('fr-FR') : '∞'} XP
          </Text>
        </View>
        {nextRank && (
          <View style={{ alignItems: 'flex-end', minWidth: 100 }}>
            <Text style={{ fontSize: 8, color: '#555', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>PROCHAIN RANG</Text>
            <Text style={{ fontFamily: 'Cinzel', fontSize: 11, color: C.dim, letterSpacing: 1, marginBottom: 2 }}>{nextRank.name} 🔒</Text>
            <Text style={{ fontSize: 9, color: '#444' }}>{xpToNext} XP restants</Text>
          </View>
        )}
      </View>

      {/* Citation */}
      <View style={{ alignItems: 'center', paddingHorizontal: 28, height: quoteH, justifyContent: 'center' }}>
        <Text style={{ fontSize: 11, color: '#555', fontStyle: 'italic', textAlign: 'center', lineHeight: 16 }}>
          "{QUOTES[rank.name]}"
        </Text>
        <Text style={{ fontFamily: 'Cinzel', fontSize: 9, color: GOLD + '88', letterSpacing: 3, marginTop: 4 }}>— KRIOS</Text>
      </View>

    </View>
  );
}
