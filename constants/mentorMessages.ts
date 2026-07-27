// constants/mentorMessages.ts
import { type MentorId } from './mentors';

const MESSAGES: Record<MentorId, string[]> = {
  krios: [
    "Chaque jour non exploité est une défaite que tu t'infliges.",
    "L'empire se construit dans l'obscurité. La gloire vient après.",
    'Discipline maintenant. Liberté demain.',
    'Le corps obéit à l\'esprit. Entraîne les deux.',
    "Ce que tu fais quand personne ne regarde, c'est qui tu es vraiment.",
    'Un seul jour perdu, c\'est un avantage offert à l\'adversaire.',
    "Bâtis aujourd'hui l'homme que tu veux être demain.",
  ],
  aspasia: [
    'Ton futur toi te regarde. Que voit-il aujourd\'hui ?',
    "L'excellence n'est pas un acte — c'est une habitude.",
    'La douleur d\'aujourd\'hui forge la force de demain.',
    'Les faibles attendent l\'inspiration. Les fortes créent la routine.',
    'Bâtis aujourd\'hui la femme que tu veux être demain.',
    "Pas d'excuses. Pas de regrets. Seulement l'action.",
    'Chaque petite victoire compte plus que tu ne le crois.',
  ],
  hermes: [
    "Un message, une action : n'attends pas le moment parfait.",
    "La vitesse ne sert à rien sans direction — mais toi, tu as les deux.",
    "Le plus rapide n'est pas celui qui court, c'est celui qui ne s'arrête jamais.",
    "Un petit pas aujourd'hui vaut mieux qu'un grand projet remis à demain.",
    "Je passe partout, je vois tout : ta constance ne m'échappe pas.",
    'La ruse, c\'est aussi savoir répéter ce qui marche.',
  ],
  penelope: [
    "Vingt ans à tisser, jamais renoncé. Ta patience aussi compte.",
    'Ce qui est fait lentement mais sûrement ne se défait jamais.',
    "On ne mesure pas la constance en un jour, mais je la vois déjà en toi.",
    'Attendre sans renoncer, c\'est déjà une victoire.',
    "Chaque fil que tu tisses aujourd'hui tient la tapisserie de demain.",
    "La loyauté envers toi-même est la plus difficile à tenir — et la plus précieuse.",
  ],
};

export function getDailyMentorMessage(mentorId: MentorId): string {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const list = MESSAGES[mentorId] ?? MESSAGES.krios;
  return list[seed % list.length];
}
