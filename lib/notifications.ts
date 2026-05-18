import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ─── 14 messages matin ───────────────────────────────────────────────────────
const MORNING_MESSAGES = [
  { title: '🌅 AEGIS', body: "Nouvelle journée. Nouvelle opportunité de devenir meilleur." },
  { title: '🌅 AEGIS', body: "Commence par l'eau. Commence par la routine. Commence." },
  { title: '🌅 AEGIS', body: "Ton futur moi te regarde. Que voit-il aujourd'hui ?" },
  { title: '🌅 AEGIS', body: "Les champions se lèvent avec intention. C'est ton heure." },
  { title: '🌅 AEGIS', body: "Une matinée gagnée, c'est une journée gagnée." },
  { title: '🌅 AEGIS', body: "Aujourd'hui tu peux faire quelque chose que tu ne pouvais pas hier." },
  { title: '🌅 AEGIS', body: "Petit à petit, l'oiseau fait son nid. Chaque jour compte." },
  { title: '🌅 AEGIS', body: "Discipline le matin. Liberté le soir." },
  { title: '🌅 AEGIS', body: "Ce que tu fais en silence construit ta réputation en public." },
  { title: '🌅 AEGIS', body: "Lève-toi avec intention. Tout commence là." },
  { title: '🌅 AEGIS', body: "Identity is repetition. Show up again today." },
  { title: '🌅 AEGIS', body: "Win the morning, win the day." },
  { title: '🌅 AEGIS', body: "Consistency compounds. Une journée de plus." },
  { title: '🌅 AEGIS', body: "Le corps obéit à l'esprit. Entraîne les deux dès maintenant." },
];

// ─── 14 messages soir ────────────────────────────────────────────────────────
const EVENING_MESSAGES = [
  { title: '⚡ AEGIS', body: "La journée n'est pas finie. Tes habitudes t'attendent." },
  { title: '⚡ AEGIS', body: "Un jour sans discipline est un avantage offert à l'adversaire." },
  { title: '⚡ AEGIS', body: "Ton streak est en jeu. Ce soir, tu choisis qui tu es." },
  { title: '⚡ AEGIS', body: "La version de toi de demain commence par ce que tu fais ce soir." },
  { title: '⚡ AEGIS', body: "Chaque habitude cochée est une brique de ton empire." },
  { title: '⚡ AEGIS', body: "Discipline maintenant. Liberté demain." },
  { title: '⚡ AEGIS', body: "Le confort d'aujourd'hui ou la fierté de demain. À toi de choisir." },
  { title: '🌙 AEGIS', body: "Avant de dormir — as-tu fait ce que tu t'étais promis ?" },
  { title: '🌙 AEGIS', body: "Earn your rest. Vérifie tes habitudes." },
  { title: '🌙 AEGIS', body: "Ce soir compte. Ouvre AEGIS pour voir où tu en es." },
  { title: '🌙 AEGIS', body: "Standards don't take evenings off." },
  { title: '🌙 AEGIS', body: "Ta journée se termine. Ta discipline, elle, ne dort pas." },
  { title: '🌙 AEGIS', body: "Check tes habitudes. Dors avec la conscience tranquille." },
  { title: '🌙 AEGIS', body: "Il reste peut-être une habitude. Une seule. Fais-la." },
];

export async function requestNotificationPermission(): Promise<boolean> {
  if (!Device.isDevice) return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleNotifications(
  morningEnabled: boolean, morningHour: number, morningMinute: number,
  eveningEnabled: boolean, eveningHour: number, eveningMinute: number,
) {
  await Notifications.cancelAllScheduledNotificationsAsync();

  const days = [1, 2, 3, 4, 5, 6, 7];

  // Offset aléatoire → rotation différente chaque semaine
  const morningOffset = Math.floor(Math.random() * MORNING_MESSAGES.length);
  const eveningOffset = Math.floor(Math.random() * EVENING_MESSAGES.length);

  for (let i = 0; i < days.length; i++) {
    const weekday = days[i];

    if (morningEnabled) {
      const msg = MORNING_MESSAGES[(i + morningOffset) % MORNING_MESSAGES.length];
      await Notifications.scheduleNotificationAsync({
        content: {
          title: msg.title,
          body: msg.body,
          sound: true,
          data: { type: 'morning' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday,
          hour: morningHour,
          minute: morningMinute,
        },
      });
    }

    if (eveningEnabled) {
      const msg = EVENING_MESSAGES[(i + eveningOffset) % EVENING_MESSAGES.length];
      await Notifications.scheduleNotificationAsync({
        content: {
          title: msg.title,
          body: msg.body,
          sound: true,
          data: { type: 'evening_check' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday,
          hour: eveningHour,
          minute: eveningMinute,
        },
      });
    }
  }
}

export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// ─── Reschedule automatique chaque semaine ────────────────────────────────────
// À appeler au lancement de l'app — reschedule si la semaine a changé
export async function autoRescheduleIfNeeded(userId: string) {
  try {
    const weekKey = `@aegis:notif_week_${getWeekNumber()}`;
    const done = await AsyncStorage.getItem(weekKey);
    if (done) return; // déjà reschedulé cette semaine

    // Récupère les prefs depuis Supabase
    const { data } = await supabase
      .from('profiles')
      .select('notif_morning, notif_morning_hour, notif_morning_minute, notif_evening, notif_evening_hour, notif_evening_minute')
      .eq('id', userId)
      .single();

    if (!data) return;

    await scheduleNotifications(
      data.notif_morning,     data.notif_morning_hour, data.notif_morning_minute,
      data.notif_evening,     data.notif_evening_hour, data.notif_evening_minute,
    );

    await AsyncStorage.setItem(weekKey, 'true');
  } catch {}
}

function getWeekNumber(): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(((now.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
  return `${now.getFullYear()}_${week}`;
}

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) return null;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'AEGIS',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#C9A84C',
    });
  }
  const granted = await requestNotificationPermission();
  if (!granted) return null;
  return null;
}

export async function savePushToken(userId: string, token: string) {
  await supabase.from('profiles').update({ push_token: token }).eq('id', userId);
}

export async function saveNotificationPrefs(userId: string, prefs: {
  notif_morning: boolean;
  notif_morning_hour: number;
  notif_morning_minute: number;
  notif_evening: boolean;
  notif_evening_hour: number;
  notif_evening_minute: number;
}) {
  await supabase.from('profiles').update(prefs).eq('id', userId);
}
