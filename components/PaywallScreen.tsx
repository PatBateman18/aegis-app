// components/PaywallScreen.tsx
// Paywall custom AEGIS — remplace les templates génériques RevenueCat.
// Tant que les vrais produits Apple ne sont pas créés (compte payant requis),
// cet écran affiche un état "bientôt disponible" propre plutôt que de planter.
//
// v2 — restructuration :
//  - Hero + bloc "programmes" fusionné (au lieu de features génériques + archétypes séparés)
//  - Frise de progression avec les vraies médailles de rang (constants/medals.ts)
//  - Sélecteur de pricing à 3 cartes (radio-select)
//  - CTA sticky visible pendant tout le scroll

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal, ScrollView, ActivityIndicator, Alert, Image, Dimensions, Animated, Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Purchases, { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import { C } from '@/constants/colors';
import { RANK_MEDALS, RANK_NAMES, RANK_MIN_LEVEL, RANK_MAX_LEVEL } from '@/constants/medals';
import SlideToConfirm from './SlideToConfirm';

const GOLD = C.gold;
const GOLD_BRIGHT = C.goldBright;

const HERO_IMAGE = require('@/assets/paywall/paywall_hero.png');

// Pages légales hébergées sur GitHub Pages (dépôt public `aegis-legal`).
// Apple exige des liens fonctionnels vers les deux dans l'app ET dans App Store Connect.
const LEGAL_URLS = {
  terms: 'https://patbateman18.github.io/aegis-legal/cgu.html',
  privacy: 'https://patbateman18.github.io/aegis-legal/confidentialite.html',
};

function openLegal(url: string) {
  Linking.openURL(url).catch(() => {
    Alert.alert('Lien indisponible', "Impossible d'ouvrir la page pour l'instant. Réessaie plus tard.");
  });
}

// Largeur réelle de l'écran : le hero doit la prendre en entier (bord à bord),
// width: '100%' + marge négative ne suffit pas car le contenu est centré.
const SCREEN_W = Dimensions.get('window').width;
const HERO_HEIGHT = SCREEN_W * 1.25; // ratio 4:5

// ─── Rangée d'icônes premium (haut de page) ────────────────────────────────
const FEATURE_ICONS = [
  {
    key: 'programmes',
    label: "Programmes\nd'élite",
    icon: require('@/assets/premium_icons/icone_programmes_elite.png'),
  },
  {
    key: 'succes',
    label: 'Succès\nlégendaires',
    icon: require('@/assets/premium_icons/icone_succes_legendaires.png'),
  },
  {
    key: 'stats',
    label: 'Statistiques\navancées',
    icon: require('@/assets/premium_icons/icone_statistiques_avancees.png'),
  },
  {
    key: 'habitudes',
    label: 'Habitudes\nillimitées',
    icon: require('@/assets/premium_icons/icone_habitudes_illimitees.png'),
  },
  {
    key: 'perso',
    label: 'Personnalisation\npremium',
    icon: require('@/assets/premium_icons/icone_personnalisation_premium.png'),
  },
];

const LOCK_ICON = require('@/assets/premium_icons/icone_paiement_securise.png');

type Props = {
  visible: boolean;
  onClose: () => void;
  onPurchaseSuccess?: () => void; // appelé quand l'achat réussit, pour rafraîchir usePremium ailleurs
};

// ─── Programmes mis en avant sur le paywall ────────────────────────────────
// Seuls 3 des 7 programmes sont montrés ici (le reste est teasé via la mention
// "+ de nouveaux programmes ajoutés régulièrement"). Les 4 autres
// (Athena, Zeus, Achilles, Leonidas) suivront le même naming dans assets/programs/
// quand ils seront générés : programme_athena.png, programme_zeus.png, etc.
const FEATURED_PROGRAMS = [
  {
    key: 'sparta',
    name: 'SPARTA',
    objective: 'Transformation physique complète',
    image: require('@/assets/programs/programme_sparta.png'),
  },
  {
    key: 'alexander',
    name: 'ALEXANDER',
    objective: 'V-Taper + Style de vie premium',
    image: require('@/assets/programs/programme_alexander.png'),
  },
  {
    key: 'apollo',
    name: 'APOLLO',
    objective: 'Glow Up / Style / Charisme',
    image: require('@/assets/programs/programme_apollo.png'),
  },
];

// Ordre d'affichage voulu pour les 3 tiers de prix : mensuel — annuel (mis en avant) — 6 mois.
// RevenueCat expose `packageType` sur chaque PurchasesPackage ('MONTHLY' | 'ANNUAL' | 'SIX_MONTH' | ...).
const PACKAGE_DISPLAY_ORDER = ['MONTHLY', 'ANNUAL', 'SIX_MONTH'];

function sortPackages(pkgs: PurchasesPackage[]): PurchasesPackage[] {
  return [...pkgs].sort((a, b) => {
    const ai = PACKAGE_DISPLAY_ORDER.indexOf(a.packageType);
    const bi = PACKAGE_DISPLAY_ORDER.indexOf(b.packageType);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });
}


// ─── Carte de tarif : la carte sélectionnée passe "devant" (plus grande, plus
// lumineuse, avec un halo doré), les autres reculent (plus petites, ternes). ──
function tierLabel(pkg: PurchasesPackage): string {
  switch (pkg.packageType) {
    case 'MONTHLY': return '1 MOIS';
    case 'ANNUAL': return '12 MOIS';
    case 'SIX_MONTH': return '6 MOIS';
    case 'LIFETIME': return 'À VIE';
    default: return pkg.product.title;
  }
}

function TierCard({
  pkg, isSelected, onPress,
}: { pkg: PurchasesPackage; isSelected: boolean; onPress: () => void }) {
  const anim = useRef(new Animated.Value(isSelected ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: isSelected ? 1 : 0,
      useNativeDriver: true,
      friction: 7,
      tension: 90,
    }).start();
  }, [isSelected]);

  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.07] });
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [5, -5] });
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] });

  return (
    <Animated.View
      style={[
        styles.tierWrap,
        { zIndex: isSelected ? 2 : 1, opacity, transform: [{ translateY }, { scale }] },
      ]}
    >
      <TouchableOpacity
        style={[styles.tierCard, isSelected && styles.tierCardSelected]}
        onPress={onPress}
        activeOpacity={0.9}
      >
        {pkg.packageType === 'ANNUAL' && (
          <View style={styles.popularBadgeWrap} pointerEvents="none">
            <View style={styles.popularBadge}>
              <Text
                style={styles.popularBadgeText}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                ★ LE PLUS POPULAIRE
              </Text>
            </View>
          </View>
        )}
        <Text style={[styles.tierLabel, isSelected && styles.tierLabelSelected]}>
          {tierLabel(pkg)}
        </Text>
        <Text style={styles.tierPrice}>{pkg.product.priceString}</Text>
        <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
          {isSelected && <View style={styles.radioInner} />}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function PaywallScreen({ visible, onClose, onPurchaseSuccess }: Props) {
  const insets = useSafeAreaInsets();
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [selectedPkg, setSelectedPkg] = useState<PurchasesPackage | null>(null);

  const sortedPackages = useMemo(
    () => (offering ? sortPackages(offering.availablePackages) : []),
    [offering]
  );

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const offerings = await Purchases.getOfferings();
        if (!cancelled) setOffering(offerings.current);
      } catch (e) {
        console.error('[Paywall] getOfferings failed:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [visible]);

  // Présélectionne l'offre annuelle par défaut dès qu'elle est chargée
  // (comportement standard "meilleur prix garanti" mis en avant).
  useEffect(() => {
    if (sortedPackages.length === 0) {
      setSelectedPkg(null);
      return;
    }
    const annual = sortedPackages.find((p) => p.packageType === 'ANNUAL');
    setSelectedPkg(annual ?? sortedPackages[0]);
  }, [sortedPackages]);

  async function handlePurchase(pkg: PurchasesPackage) {
    setPurchasing(pkg.identifier);
    try {
      await Purchases.purchasePackage(pkg);
      onPurchaseSuccess?.();
      Alert.alert('✅ Bienvenue dans AEGIS Premium', 'Ton abonnement est actif.');
      onClose();
    } catch (e: any) {
      if (!e.userCancelled) {
        console.error('[Paywall] purchase failed:', e);
        Alert.alert('Erreur', "L'achat n'a pas pu être finalisé. Réessaie plus tard.");
      }
    } finally {
      setPurchasing(null);
    }
  }

  async function handleRestore() {
    try {
      const info = await Purchases.restorePurchases();
      const isPremium = Object.keys(info.entitlements.active).length > 0;
      if (isPremium) {
        onPurchaseSuccess?.();
        Alert.alert('✅ Achats restaurés', 'Ton abonnement premium est actif.');
        onClose();
      } else {
        Alert.alert('Aucun achat trouvé', "Aucun abonnement actif n'a été trouvé sur ce compte.");
      }
    } catch (e) {
      console.error('[Paywall] restore failed:', e);
      Alert.alert('Erreur', "La restauration a échoué. Réessaie plus tard.");
    }
  }

  const rankLevels = useMemo(
    () => Array.from(
      { length: RANK_MAX_LEVEL - RANK_MIN_LEVEL + 1 },
      (_, i) => RANK_MIN_LEVEL + i
    ),
    []
  );

  const hasOffers = !loading && sortedPackages.length > 0;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        <TouchableOpacity
          style={[styles.closeBtn, { top: insets.top + 8 }]}
          onPress={onClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: 140 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
        >
          {/* ─── Hero ─── */}
          <View style={styles.heroWrap}>
            <Image source={HERO_IMAGE} style={styles.heroImage} resizeMode="cover" />
            <View style={styles.heroOverlay}>
              <Text style={styles.lambda}>Λ</Text>
              <Text style={styles.title}>AEGIS PREMIUM</Text>
              <Text style={styles.subtitle}>
                Certains s'arrêtent au niveau Novice.{'\n'}D'autres deviennent des légendes.
              </Text>
            </View>
          </View>

          {/* ─── Rangée d'icônes premium ─── */}
          <View style={styles.sectionDivider}>
            <Text style={styles.sectionLabel}>✦ AEGIS PREMIUM DÉBLOQUE LE CHEMIN COMPLET ✦</Text>
          </View>

          <View style={styles.featureRow}>
            {FEATURE_ICONS.map((f) => (
              <View key={f.key} style={styles.featureItem}>
                <Image source={f.icon} style={styles.featureIcon} resizeMode="contain" />
                <Text style={styles.featureLabel} allowFontScaling={false}>
                  {f.label}
                </Text>
              </View>
            ))}
          </View>

          {/* ─── Bloc programmes fusionné ─── */}
          <View style={styles.sectionDivider}>
            <Text style={styles.sectionLabel}>✦ CE QUI T'ATTEND ✦</Text>
          </View>

          <View style={styles.programsRow}>
            {FEATURED_PROGRAMS.map((p) => (
              <View key={p.key} style={styles.programCard}>
                <Image source={p.image} style={styles.programImage} resizeMode="cover" />
                <View style={styles.programOverlay}>
                  <Text style={styles.programName}>{p.name}</Text>
                  <Text style={styles.programObjective}>{p.objective}</Text>
                </View>
              </View>
            ))}
          </View>

          <Text style={styles.moreProgramsText}>
            + de nouveaux programmes ajoutés régulièrement
          </Text>

          {/* ─── Frise de progression (vraies médailles) ─── */}
          <View style={styles.sectionDivider}>
            <Text style={styles.sectionLabel}>✦ TON ÉVOLUTION. TON HÉRITAGE. ✦</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.rankRow}
          >
            {rankLevels.map((level, idx) => (
              <View key={level} style={styles.rankItem}>
                <Image source={RANK_MEDALS[level]} style={styles.rankMedal} resizeMode="contain" />
                <Text style={styles.rankName}>{RANK_NAMES[level]}</Text>
                {idx < rankLevels.length - 1 && <Text style={styles.rankChevron}>›</Text>}
              </View>
            ))}
          </ScrollView>
          <Text style={styles.rankCaption}>
            Avec AEGIS Premium, débloque chaque rang, chaque récompense et chaque partie de ton potentiel.
          </Text>

          {/* ─── Pricing ─── */}
          <View style={styles.sectionDivider}>
            <Text style={styles.sectionLabel}>✦ CHOISIS TA VOIE ✦</Text>
          </View>

          {loading ? (
            <ActivityIndicator color={GOLD} style={{ marginTop: 24 }} />
          ) : hasOffers ? (
            <View style={styles.tiersRow}>
              {sortedPackages.map((pkg) => (
                <TierCard
                  key={pkg.identifier}
                  pkg={pkg}
                  isSelected={selectedPkg?.identifier === pkg.identifier}
                  onPress={() => setSelectedPkg(pkg)}
                />
              ))}
            </View>
          ) : (
            <View style={styles.comingSoonBox}>
              <Text style={styles.comingSoonText}>
                Les abonnements arrivent très bientôt.
              </Text>
            </View>
          )}

          <TouchableOpacity style={styles.restoreBtn} onPress={handleRestore}>
            <Text style={styles.restoreText}>Restaurer mes achats</Text>
          </TouchableOpacity>

          <View style={styles.legalRow}>
            <TouchableOpacity
              onPress={() => openLegal(LEGAL_URLS.terms)}
              hitSlop={{ top: 12, bottom: 12, left: 10, right: 10 }}
            >
              <Text style={styles.legalText}>Conditions d'utilisation</Text>
            </TouchableOpacity>
            <Text style={styles.legalDot}>·</Text>
            <TouchableOpacity
              onPress={() => openLegal(LEGAL_URLS.privacy)}
              hitSlop={{ top: 12, bottom: 12, left: 10, right: 10 }}
            >
              <Text style={styles.legalText}>Confidentialité</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* ─── CTA sticky (slide-to-confirm) ─── */}
        <View style={[styles.stickyBar, { paddingBottom: 14 + insets.bottom }]}>
          <SlideToConfirm
            label={
              hasOffers
                ? 'GLISSE POUR COMMENCER TA LÉGENDE'
                : __DEV__
                  ? 'MODE TEST : GLISSE ICI'
                  : 'BIENTÔT DISPONIBLE'
            }
            disabled={!__DEV__ && (!hasOffers || !selectedPkg)}
            loading={purchasing !== null}
            onConfirm={() => {
              if (selectedPkg) {
                handlePurchase(selectedPkg);
              } else {
                Alert.alert('Mode test', "Le slider fonctionne. Aucun produit réel pour l'instant.");
              }
            }}
          />
          <View style={styles.secureRow}>
            <Image source={LOCK_ICON} style={styles.secureIcon} resizeMode="contain" />
            <Text style={styles.secureText}>Paiement sécurisé</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  closeBtn: {
    position: 'absolute', top: 16, right: 16, zIndex: 10,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.55)', borderWidth: 1, borderColor: GOLD + '44',
    alignItems: 'center', justifyContent: 'center',
  },
  closeText: { color: GOLD, fontSize: 16, fontWeight: '700' },
  scroll: { paddingHorizontal: 24, paddingTop: 0, alignItems: 'center' },

  // Hero
  heroWrap: {
    width: SCREEN_W, height: HERO_HEIGHT,
    marginHorizontal: -24, marginTop: 0, marginBottom: 20,
    overflow: 'hidden',
  },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 24, paddingTop: 60, paddingBottom: 24,
    alignItems: 'center',
  },
  // Pas de bandeau : l'ombre portée garde le texte lisible directement sur l'image.
  lambda: {
    fontSize: 36, color: GOLD, marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.9)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 10,
  },
  title: {
    fontFamily: 'Cinzel', fontSize: 24, color: GOLD_BRIGHT,
    letterSpacing: 4, textAlign: 'center', marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.9)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 12, color: '#F2F2F2', textAlign: 'center',
    letterSpacing: 0.5, lineHeight: 18,
    textShadowColor: 'rgba(0,0,0,0.95)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 8,
  },

  sectionDivider: { width: '100%', alignItems: 'center', marginTop: 8, marginBottom: 16 },
  sectionLabel: {
    fontFamily: 'Cinzel', fontSize: 12, color: GOLD,
    letterSpacing: 2, textAlign: 'center',
  },

  // Rangée d'icônes premium
  // 5 colonnes égales sur (presque) toute la largeur de l'écran : plus de défilement,
  // tout est visible d'un coup. width explicite car le contenu parent est centré.
  featureRow: {
    flexDirection: 'row', width: SCREEN_W - 12, alignSelf: 'center',
    paddingVertical: 6, marginBottom: 6,
  },
  featureItem: { flex: 1, alignItems: 'center' },
  featureIcon: { width: 44, height: 44, marginBottom: 8 },
  featureLabel: {
    fontSize: 9, color: C.dim, textAlign: 'center', lineHeight: 12,
  },

  // Programmes
  programsRow: { flexDirection: 'row', width: '100%', gap: 10, marginBottom: 10 },
  programCard: {
    flex: 1, aspectRatio: 3 / 4, borderRadius: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: GOLD + '33', backgroundColor: '#0A0A0A',
  },
  programImage: { width: '100%', height: '100%' },
  programOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.55)', paddingVertical: 8, paddingHorizontal: 6,
  },
  programName: {
    fontFamily: 'Cinzel', fontSize: 12, color: GOLD_BRIGHT,
    letterSpacing: 1, textAlign: 'center', marginBottom: 2,
  },
  programObjective: {
    fontSize: 9, color: C.text, textAlign: 'center', lineHeight: 12,
  },
  moreProgramsText: {
    fontSize: 11, color: C.dim, textAlign: 'center',
    marginTop: 12, marginBottom: 4, fontStyle: 'italic',
  },

  // Frise de rangs
  rankRow: { alignItems: 'center', paddingVertical: 8, paddingHorizontal: 4 },
  rankItem: { alignItems: 'center', marginHorizontal: 6, flexDirection: 'row' },
  rankMedal: { width: 44, height: 44 },
  rankName: {
    fontSize: 9, color: C.dim, marginLeft: 4, marginRight: 2,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  rankChevron: { color: GOLD + '66', fontSize: 14, marginLeft: 2 },
  rankCaption: {
    fontSize: 11, color: C.dim, textAlign: 'center',
    marginTop: 8, marginBottom: 4, paddingHorizontal: 12, lineHeight: 16,
  },

  // Pricing
  tiersRow: { flexDirection: 'row', width: '100%', gap: 8, marginTop: 22, marginBottom: 10 },
  tierWrap: { flex: 1 },
  tierCard: {
    borderRadius: 14, borderWidth: 1, borderColor: GOLD + '22',
    backgroundColor: '#0A0A0A', paddingVertical: 18, paddingHorizontal: 8,
    alignItems: 'center',
  },
  tierCardSelected: {
    backgroundColor: '#17120A', borderColor: GOLD, borderWidth: 1.5,
    shadowColor: GOLD, shadowOpacity: 0.55, shadowRadius: 16, shadowOffset: { width: 0, height: 6 },
  },
  popularBadgeWrap: {
    position: 'absolute', top: -11, left: -6, right: -6, alignItems: 'center',
  },
  popularBadge: {
    backgroundColor: GOLD, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
  },
  popularBadgeText: { fontSize: 7.5, color: '#000', fontWeight: '700', letterSpacing: 0.3 },
  tierLabel: { fontSize: 11, color: C.dim, letterSpacing: 1, marginBottom: 6 },
  tierLabelSelected: { color: GOLD },
  tierPrice: {
    fontFamily: 'Cinzel', fontSize: 16, color: GOLD_BRIGHT,
    marginBottom: 10, textAlign: 'center',
  },
  radioOuter: {
    width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: GOLD + '55',
    alignItems: 'center', justifyContent: 'center',
  },
  radioOuterSelected: { borderColor: GOLD },
  radioInner: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: GOLD },

  comingSoonBox: {
    width: '100%', padding: 20, borderRadius: 12,
    borderWidth: 1, borderColor: GOLD + '33', alignItems: 'center', marginTop: 12,
  },
  comingSoonText: { color: C.dim, fontSize: 14, textAlign: 'center' },

  restoreBtn: { marginTop: 20 },
  restoreText: { color: C.dim, fontSize: 13, textDecorationLine: 'underline' },
  legalRow: { flexDirection: 'row', marginTop: 10, alignItems: 'center' },
  legalText: { color: C.dim, fontSize: 11, textDecorationLine: 'underline' },
  legalDot: { color: C.dim, fontSize: 11, marginHorizontal: 8 },

  // CTA sticky
  stickyBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: C.bg, borderTopWidth: 1, borderTopColor: GOLD + '22',
    paddingTop: 14, paddingHorizontal: 24, alignItems: 'center',
  },
  secureRow: { marginTop: 10, flexDirection: 'row', alignItems: 'center' },
  secureIcon: { width: 12, height: 12, marginRight: 5 },
  secureText: { color: C.dim, fontSize: 10 },
});
