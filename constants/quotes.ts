// constants/quotes.ts

export type Quote = {
  text: string;
  author?: string;
};

export const QUOTES: Quote[] = [
  // ── Anglais courts ────────────────────────────────────────────────────────
  { text: "Consistency compounds." },
  { text: "Discipline creates standards." },
  { text: "Identity is repetition." },
  { text: "Win the morning, win the day." },
  { text: "Motion beats meditation." },
  { text: "Earn your rest." },
  { text: "Progress, not perfection." },
  { text: "Show up. Every single day." },
  { text: "Small steps. Every day." },
  { text: "Standards are the foundation of identity." },
  { text: "Do it tired. Do it scared. Just do it." },
  { text: "You don't find discipline. You build it." },
  { text: "Be the same person at midnight as you are at noon." },
  { text: "The body achieves what the mind believes." },

  // ── Anglais avec auteur ───────────────────────────────────────────────────
  { text: "Waste no more time arguing about what a good man should be. Be one.", author: "Marc Aurèle" },
  { text: "Difficulties strengthen the mind, as labour does the body.", author: "Sénèque" },
  { text: "First say to yourself what you would be; then do what you have to do.", author: "Épictète" },
  { text: "You do not rise to the level of your goals. You fall to the level of your systems.", author: "James Clear" },

  // ── Français courts ───────────────────────────────────────────────────────
  { text: "La constance bat le talent." },
  { text: "L'identité précède la motivation." },
  { text: "Ta vie reflète tes habitudes." },
  { text: "Sois le même homme à minuit qu'à midi." },
  { text: "La régularité est une forme de respect envers soi-même." },
  { text: "Ce que tu fais en silence définit qui tu es." },
  { text: "Chaque action est un vote pour la personne que tu deviens." },
  { text: "La discipline, c'est choisir ce que tu veux le plus sur ce que tu veux maintenant." },
  { text: "Ne cherche pas à être meilleur que les autres. Sois meilleur qu'hier." },
  { text: "L'excellence n'est pas un acte. C'est une habitude." },
  { text: "Le corps obéit à l'esprit. Entraîne les deux." },
  { text: "Commence. Le reste vient après." },
  { text: "La douleur d'aujourd'hui forge la force de demain." },
  { text: "Un homme sans discipline est un homme sans direction." },

  // ── Français avec auteur ─────────────────────────────────────────────────
  { text: "L'empire se construit dans l'obscurité. La gloire vient après.", author: "AEGIS" },
  { text: "Ce qui ne me tue pas me rend plus fort.", author: "Nietzsche" },
];

/**
 * Retourne une citation du jour — stable toute la journée,
 * change chaque jour à minuit.
 */
export function getDailyQuote(): Quote {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return QUOTES[dayOfYear % QUOTES.length];
}
