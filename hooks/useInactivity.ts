// hooks/useInactivity.ts
// Suit l'absence de l'utilisateur pour adapter le message de KRIOS/ASPASIA.
// Aucune pénalité XP, aucune notion de "danger" — l'absence fait partie du
// parcours du héros, pas une faute à sanctionner. Voir la discussion Rétention
// & Système RPG : le système précédent (pénalité XP permanente + urgence
// affichée) risquait d'aggraver l'abandon plutôt que de le prévenir.

import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_LAST_ACTIVE = '@aegis:last_active_date';
const KEY_RETURN_STATE = '@aegis:return_state'; // fige l'état de retour pour toute la journée

// Nombre de jours d'absence à partir duquel la quête allégée remplace le set normal.
// En dessous, on affiche quand même le message KRIOS/ASPASIA, mais les quêtes restent normales.
export const RETURN_QUEST_THRESHOLD_DAYS = 7;

export type InactivityStatus = {
  daysInactive: number;        // nombre de jours sans connexion
  isReturning: boolean;        // true dès 1 jour d'absence — sert à afficher un accueil de retour, pas une alerte
  kriosMessage: string | null; // message KRIOS/ASPASIA à afficher, toujours bienveillant
};

// ─── Messages KRIOS/ASPASIA selon les jours d'absence ─────────────────────────
// Principe : jamais de honte, jamais de menace ("danger", "tu perds"...).
// L'absence est reconnue, jamais minimisée, mais toujours présentée comme un
// chapitre du parcours — et la porte reste ouverte, sans urgence artificielle.
function getKriosMessage(days: number, name: string, gender: string = 'male'): string | null {
  if (days <= 0) return null;

  if (gender === 'female') {
    if (days === 1) return `${name}, te revoilà. Une journée de silence ne défait rien de ce que tu as construit.`;
    if (days === 2) return `Deux jours loin du chemin, ${name}. Il n'a pas bougé — reprends-le à ton rythme.`;
    if (days <= 4)  return `${days} jours se sont écoulés. Même les plus grandes héroïnes connaissent des silences. Ce qui compte, c'est que tu sois là aujourd'hui.`;
    if (days <= 6)  return `Une semaine presque passée, ${name}. Pas de jugement — juste la porte, toujours ouverte.`;
    if (days <= 13) return `${days} jours d'absence. Ton histoire ne s'arrête pas là. Chaque retour est une décision qui compte autant que la constance elle-même.`;
    return `${days} jours. Le temps a passé, mais rien n'est perdu, ${name} — seulement en pause. Le chemin t'attend, sans compter les jours contre toi.`;
  }

  if (days === 1) return `${name}, te revoilà. Une journée de silence ne défait rien de ce que tu as construit.`;
  if (days === 2) return `Deux jours loin du chemin, ${name}. Il n'a pas bougé — reprends-le à ton rythme.`;
  if (days <= 4)  return `${days} jours se sont écoulés. Même les plus grands héros connaissent des silences. Ce qui compte, c'est que tu sois là aujourd'hui.`;
  if (days <= 6)  return `Une semaine presque passée, ${name}. Pas de jugement — juste la porte, toujours ouverte.`;
  if (days <= 13) return `${days} jours d'absence. Ton histoire ne s'arrête pas là. Chaque retour est une décision qui compte autant que la constance elle-même.`;
  return `${days} jours. Le temps a passé, mais rien n'est perdu, ${name} — seulement en pause. Le chemin t'attend, sans compter les jours contre toi.`;
}

export function useInactivity(userId: string | undefined, userName: string, gender: string = 'male') {
  const [status, setStatus] = useState<InactivityStatus>({
    daysInactive: 0,
    isReturning: false,
    kriosMessage: null,
  });

  const checkInactivity = useCallback(async () => {
    if (!userId) return;

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const stored = await AsyncStorage.getItem(KEY_LAST_ACTIVE);

    if (!stored) {
      // Fresh install ou AsyncStorage vidé — on enregistre aujourd'hui, rien à afficher
      await AsyncStorage.setItem(KEY_LAST_ACTIVE, today);
      await AsyncStorage.removeItem(KEY_RETURN_STATE);
      setStatus({ daysInactive: 0, isReturning: false, kriosMessage: null });
      return;
    }

    // Un retour a-t-il déjà été détecté aujourd'hui ? Si oui, on restaure exactement le
    // même état plutôt que de recalculer — sinon fermer/rouvrir l'app efface la détection,
    // puisque la date "dernière activité" est déjà mise à jour à ce stade.
    const savedRaw = await AsyncStorage.getItem(KEY_RETURN_STATE);
    if (savedRaw) {
      try {
        const saved = JSON.parse(savedRaw);
        if (saved.date === today) {
          setStatus({
            daysInactive: saved.daysInactive,
            isReturning: saved.daysInactive >= RETURN_QUEST_THRESHOLD_DAYS,
            kriosMessage: saved.kriosMessage,
          });
          return;
        }
      } catch {
        // JSON corrompu, on ignore et on recalcule normalement
      }
    }

    const lastDate = new Date(stored);
    const todayDate = new Date(today);
    const msPerDay = 1000 * 60 * 60 * 24;
    const daysInactive = Math.floor((todayDate.getTime() - lastDate.getTime()) / msPerDay);

    if (daysInactive <= 0) {
      // Même jour — rien à signaler
      setStatus({ daysInactive: 0, isReturning: false, kriosMessage: null });
      return;
    }

    const message = getKriosMessage(daysInactive, userName, gender);

    // Fige l'état pour le reste de la journée AVANT de mettre à jour la dernière date active
    await AsyncStorage.setItem(KEY_RETURN_STATE, JSON.stringify({ date: today, daysInactive, kriosMessage: message }));
    await AsyncStorage.setItem(KEY_LAST_ACTIVE, today);

    setStatus({
      daysInactive,
      isReturning: daysInactive >= RETURN_QUEST_THRESHOLD_DAYS,
      kriosMessage: message,
    });
  }, [userId, userName, gender]);

  // Marquer l'utilisateur comme actif aujourd'hui — efface le message de retour
  const markActive = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];
    await AsyncStorage.setItem(KEY_LAST_ACTIVE, today);
    await AsyncStorage.removeItem(KEY_RETURN_STATE);
    setStatus({ daysInactive: 0, isReturning: false, kriosMessage: null });
  }, []);

  useEffect(() => {
    checkInactivity();
  }, [userId]);

  return { status, markActive };
}
