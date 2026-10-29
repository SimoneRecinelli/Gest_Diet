// Emoji in base al nome dell'alimento. Il primo che corrisponde vince, quindi l'ordine conta
// (es. "pizza" prima di "patatine", così il Menu Pizzeria ha la pizza).
const RULES: [RegExp, string][] = [
  [/pizza/i, '🍕'],
  [/sushi|nigiri/i, '🍣'],
  [/hamburger|panino|paninoteca/i, '🍔'],
  [/patatine/i, '🍟'],
  [/patate/i, '🥔'],
  [/banan/i, '🍌'],
  [/fragol/i, '🍓'],
  [/\bmel[ae]\b/i, '🍎'],
  [/ananas/i, '🍍'],
  [/\buva\b/i, '🍇'],
  [/latte/i, '🥛'],
  [/yogurt|fruyo/i, '🍧'],
  [/muesli|cereali|avena|nesquik/i, '🥣'],
  [/pasta|tortellini|gnocchi/i, '🍝'],
  [/verdur|carote|zucchin/i, '🥬'],
  [/parmigiano|grana|pecorino|mozzarella|sottilette/i, '🧀'],
  [/pollo|tacchino/i, '🍗'],
  [/vitellone|maiale|bresaola|manzo|tagliata|entrec/i, '🥩'],
  [/pesce|rana pescatrice|sogliola|palombo|salmone|tonno|polpo|insalata di mare/i, '🐟'],
  [/uova/i, '🥚'],
  [/olio/i, '🫒'],
  [/nutella/i, '🍫'],
  [/cornetto/i, '🥐'],
  [/pane/i, '🍞'],
  [/sugo|salsa|ketchup/i, '🍅'],
  [/fagioli|lenticchie/i, '🫘'],
];

const CATEGORY_FALLBACK: Record<string, string> = {
  Frutta: '🍎',
  Carboidrati: '🌾',
  Proteine: '🥩',
  Verdure: '🥗',
};

export function getFoodIcon(name: string, category?: string | null): string {
  for (const [pattern, icon] of RULES) {
    if (pattern.test(name)) return icon;
  }
  return (category && CATEGORY_FALLBACK[category]) || '🍽️';
}
