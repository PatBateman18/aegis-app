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

import { useEffect, useMemo, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal, ScrollView, ActivityIndicator, Alert, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Purchases, { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import { C } from '@/constants/colors';
import { RANK_MEDALS, RANK_NAMES, RANK_MIN_LEVEL, RANK_MAX_LEVEL } from '@/constants/medals';
import SlideToConfirm from './SlideToConfirm';

const GOLD = C.gold;
const GOLD_BRIGHT = C.goldBright;

const HERO_IMAGE = require('@/assets/paywall/paywall_hero.png');

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
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
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

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featureRow}
          >
            {FEATURE_ICONS.map((f) => (
              <View key={f.key} style={styles.featureItem}>
                <Image source={f.icon} style={styles.featureIcon} resizeMode="contain" />
                <Text style={styles.featureLabel}>{f.label}</Text>
              </View>
            ))}
          </ScrollView>

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
              {sortedPackages.map((pkg) => {
                const isAnnual = pkg.packageType === 'ANNUAL';
                const isSelected = selectedPkg?.identifier === pkg.identifier;
                return (
                  <TouchableOpacity
                    key={pkg.identifier}
                    style={[
                      styles.tierCard,
                      isAnnual && styles.tierCardPopular,
                      isSelected && styles.tierCardSelected,
                    ]}
                    onPress={() => setSelectedPkg(pkg)}
                    activeOpacity={0.85}
                  >
                    {isAnnual && (
                      <View style={styles.popularBadge}>
                        <Text style={styles.popularBadgeText}>★ LE PLUS POPULAIRE</Text>
                      </View>
                    )}
                    <Text style={styles.tierLabel}>
                      {pkg.packageType === 'MONTHLY' ? '1 MOIS'
                        : pkg.packageType === 'ANNUAL' ? '12 MOIS'
                        : pkg.packageType === 'SIX_MONTH' ? '6 MOIS'
                        : pkg.product.title}
                    </Text>
                    <Text style={styles.tierPrice}>{pkg.product.priceString}</Text>
                    <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
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
            <Text style={styles.legalText}>Conditions d'utilisation</Text>
            <Text style={styles.legalDot}>·</Text>
            <Text style={styles.legalText}>Confidentialité</Text>
          </View>
        </ScrollView>

        {/* ─── CTA sticky (slide-to-confirm) ─── */}
        <View style={[styles.stickyBar, { paddingBottom: 14 + insets.bottom }]}>
          <SlideToConfirm
            label={hasOffers ? 'GLISSE POUR COMMENCER TA LÉGENDE' : 'BIENTÔT DISPONIBLE'}
            disabled={!hasOffers || !selectedPkg}
            loading={purchasing !== null}
            onConfirm={() => selectedPkg && handlePurchase(selectedPkg)}
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
  scroll: { padding: 24, paddingTop: 60, alignItems: 'center' },

  // Hero
  heroWrap: {
    width: '100%', marginHorizontal: -24, marginTop: -60, marginBottom: 20,
    aspectRatio: 4 / 5, overflow: 'hidden',
  },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 24, paddingTop: 60, paddingBottom: 24,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
  },
  lambda: { fontSize: 36, color: GOLD, marginBottom: 6 },
  title: {
    fontFamily: 'Cinzel', fontSize: 24, color: GOLD_BRIGHT,
    letterSpacing: 4, textAlign: 'center', marginBottom: 8,
  },
  subtitle: {
    fontSize: 12, color: '#EDEDED', textAlign: 'center',
    letterSpacing: 0.5, lineHeight: 18,
  },

  sectionDivider: { width: '100%', alignItems: 'center', marginTop: 8, marginBottom: 16 },
  sectionLabel: {
    fontFamily: 'Cinzel', fontSize: 12, color: GOLD,
    letterSpacing: 2, textAlign: 'center',
  },

  // Rangée d'icônes premium
  featureRow: { paddingVertical: 4, paddingHorizontal: 2 },
  featureItem: { width: 84, alignItems: 'center', marginHorizontal: 6 },
  featureIcon: { width: 40, height: 40, marginBottom: 6 },
  featureLabel: {
    fontSize: 10, color: C.dim, textAlign: 'center', lineHeight: 13,
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
  tiersRow: { flexDirection: 'row', width: '100%', gap: 8, marginTop: 8 },
  tierCard: {
    flex: 1, borderRadius: 14, borderWidth: 1, borderColor: GOLD + '33',
    backgroundColor: '#0A0A0A', paddingVertical: 16, paddingHorizontal: 8,
    alignItems: 'center', position: 'relative',
  },
  tierCardPopular: { borderColor: GOLD, paddingTop: 24 },
  tierCardSelected: { backgroundColor: GOLD + '14', borderColor: GOLD },
  popularBadge: {
    position: 'absolute', top: -10, alignSelf: 'center',
    backgroundColor: GOLD, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
  },
  popularBadgeText: { fontSize: 8, color: '#000', fontWeight: '700', letterSpacing: 0.5 },
  tierLabel: { fontSize: 11, color: C.dim, letterSpacing: 1, marginBottom: 6 },
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
  legalText: { color: C.dim, fontSize: 10, opacity: 0.7 },
  legalDot: { color: C.dim, fontSize: 10, marginHorizontal: 6, opacity: 0.7 },

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
