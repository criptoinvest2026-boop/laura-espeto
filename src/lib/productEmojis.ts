// Maps product keywords to emojis — Top Espetos catalog
const emojiMap: [RegExp, string][] = [
  // Carnes
  [/picanha/i, '🥩'],
  [/bananinha/i, '🥓'],
  [/cupim/i, '🥩'],
  [/alcatra|maminha|fraldinha|contra.?fil|file|filé/i, '🥩'],
  [/boi|carne|bovin/i, '🥩'],
  [/frango|peito|coraç|sass|galet/i, '🍗'],
  [/linguiç|calabres|toscan/i, '🌭'],
  [/kafta|kibe|almôndega/i, '🍖'],
  [/medalh|bacon/i, '🥓'],
  [/porco|suín|panceta|costela|pernil/i, '🐖'],
  [/peixe|tilápia|salmão|camarão/i, '🦐'],
  [/queijo|coalho|muçarela|mussarela/i, '🧀'],
  [/legume|cebola|pimentão|abobrinha|tomate|vegetar/i, '🫑'],
  [/pão.*alho|pao.*alho/i, '🧄'],
  [/pão|pao/i, '🍞'],
  [/medalhão/i, '🥩'],

  // Bebidas
  [/cerveja|chopp|brahma|skol|heineken|budweiser|amistel|original|corona|long neck|litrinho/i, '🍺'],
  [/refrigerante|coca|guarana|sprite|fanta/i, '🥤'],
  [/água|agua/i, '💧'],
  [/suco/i, '🧃'],
  [/energético|energetico|red bull/i, '⚡'],
  [/caipirinha|drink|cachaça|vodka/i, '🍹'],

  // Acompanhamentos
  [/farofa/i, '🌾'],
  [/vinagrete|salada/i, '🥗'],
  [/arroz/i, '🍚'],
  [/batata.*frita|fritas/i, '🍟'],
  [/molho|pimenta/i, '🌶️'],
];

export function getProductEmoji(name: string): string {
  for (const [pattern, emoji] of emojiMap) {
    if (pattern.test(name)) return emoji;
  }
  return '🍢'; // default espetinho emoji
}
