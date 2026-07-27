// constants/fragrances.ts
// Base locale curatée de parfums pour la section Suggestions de la page Style.
// Pas de photos de flacon réelles (droits de marque) — juste l'icône générique
// icone_style_parfum.png, déjà utilisée sur la tuile PARFUM d'Aperçu du jour.
//
// intensite / tenue : notes indicatives sur 5, estimation raisonnable
// (pas de scraping Fragrantica/Parfumo — juste des repères publics connus).

export type Fragrance = {
  key: string;
  name: string;
  brand: string;
  tag: 'ÉLÉGANT' | 'DÉCONTRACTÉ' | 'STREETWEAR' | 'SPORTIF' | 'SOIRÉE' | 'MINIMALISTE' | 'CLASSIQUE';
  intensite: number; // 1-5
  tenue: number;      // 1-5
};

export const FRAGRANCES: Fragrance[] = [
  { key: 'bleu-de-chanel',        name: 'Bleu de Chanel',            brand: 'Chanel',          tag: 'ÉLÉGANT',     intensite: 4, tenue: 3 },
  { key: 'sauvage',                name: 'Sauvage',                   brand: 'Dior',            tag: 'STREETWEAR',  intensite: 4, tenue: 4 },
  { key: 'aventus',                name: 'Aventus',                   brand: 'Creed',           tag: 'CLASSIQUE',   intensite: 5, tenue: 5 },
  { key: 'terre-hermes',          name: "Terre d'Hermès",            brand: 'Hermès',          tag: 'MINIMALISTE', intensite: 3, tenue: 3 },
  { key: 'acqua-di-gio',          name: 'Acqua di Giò',              brand: 'Armani',          tag: 'DÉCONTRACTÉ', intensite: 2, tenue: 2 },
  { key: 'y-eau-de-parfum',       name: 'Y Eau de Parfum',           brand: 'Yves Saint Laurent', tag: 'ÉLÉGANT',  intensite: 4, tenue: 4 },
  { key: 'code',                   name: 'Code',                      brand: 'Armani',          tag: 'SOIRÉE',      intensite: 3, tenue: 3 },
  { key: 'invictus',               name: 'Invictus',                  brand: 'Paco Rabanne',    tag: 'SPORTIF',     intensite: 3, tenue: 3 },
  { key: 'stronger-with-you',     name: 'Stronger With You',         brand: 'Emporio Armani',  tag: 'DÉCONTRACTÉ', intensite: 3, tenue: 3 },
  { key: 'oud-wood',               name: 'Oud Wood',                  brand: 'Tom Ford',        tag: 'CLASSIQUE',   intensite: 5, tenue: 5 },
  { key: 'eros',                   name: 'Eros',                      brand: 'Versace',         tag: 'SOIRÉE',      intensite: 4, tenue: 3 },
  { key: '1-million',              name: '1 Million',                 brand: 'Paco Rabanne',    tag: 'STREETWEAR',  intensite: 4, tenue: 4 },
  { key: 'le-male',                name: 'Le Mâle',                   brand: 'Jean Paul Gaultier', tag: 'CLASSIQUE', intensite: 4, tenue: 4 },
  { key: 'homme-intense',         name: 'Homme Intense',             brand: 'Dior',            tag: 'ÉLÉGANT',     intensite: 4, tenue: 4 },
  { key: 'allure-homme-sport',    name: 'Allure Homme Sport',        brand: 'Chanel',          tag: 'SPORTIF',     intensite: 3, tenue: 3 },
  { key: 'green-irish-tweed',     name: 'Green Irish Tweed',         brand: 'Creed',           tag: 'MINIMALISTE', intensite: 3, tenue: 3 },
  { key: 'the-one',                name: 'The One',                   brand: 'Dolce & Gabbana', tag: 'ÉLÉGANT',    intensite: 3, tenue: 3 },
  { key: 'silver-mountain-water', name: 'Silver Mountain Water',     brand: 'Creed',           tag: 'DÉCONTRACTÉ', intensite: 2, tenue: 2 },
  { key: 'noir-extreme',          name: "Noir Extrême",              brand: 'Tom Ford',        tag: 'SOIRÉE',      intensite: 5, tenue: 5 },
  { key: 'ultra-male',             name: 'Ultra Male',                brand: 'Jean Paul Gaultier', tag: 'STREETWEAR', intensite: 4, tenue: 4 },
  { key: 'wanted',                 name: 'Wanted',                    brand: 'Azzaro',          tag: 'DÉCONTRACTÉ', intensite: 3, tenue: 3 },
  { key: 'spicebomb',              name: 'Spicebomb',                 brand: 'Viktor & Rolf',   tag: 'SOIRÉE',      intensite: 4, tenue: 4 },
  { key: 'eau-sauvage',           name: 'Eau Sauvage',               brand: 'Dior',            tag: 'MINIMALISTE', intensite: 2, tenue: 2 },
  { key: 'bleu-de-chanel-parfum', name: 'Bleu de Chanel Parfum',     brand: 'Chanel',          tag: 'CLASSIQUE',   intensite: 5, tenue: 5 },
];

// Sélection déterministe du jour — même logique que la citation du jour :
// stable pour tout le monde, change chaque jour, aucun état à stocker.
export function getDailyFragrance(date: Date = new Date()): Fragrance {
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000
  );
  return FRAGRANCES[dayOfYear % FRAGRANCES.length];
}

export function getFragranceByKey(key: string): Fragrance | undefined {
  return FRAGRANCES.find(f => f.key === key);
}
