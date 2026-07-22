// Ponto da carne + observação por item, persistidos na coluna `sales.notes`
// (texto livre já existente no banco — nenhuma migração necessária).
// Formato gravado: "Ao ponto | sem sal", "Ao ponto" ou apenas "sem cebola".

export const DONENESS_OPTIONS = ['Mal passada', 'Ao ponto', 'Bem passada'] as const;
export type Doneness = (typeof DONENESS_OPTIONS)[number];

const SEPARATOR = ' | ';

/** Monta a string de notes a partir do ponto + observação. Retorna null se ambos vazios. */
export function formatNotes(doneness: string | null, obs: string): string | null {
  const parts = [doneness, obs.trim()].filter(Boolean) as string[];
  return parts.length ? parts.join(SEPARATOR) : null;
}

/** Desmonta a string de notes de volta em { doneness, obs }. Tolerante a texto livre. */
export function parseNotes(notes: string | null | undefined): { doneness: string | null; obs: string | null } {
  if (!notes) return { doneness: null, obs: null };
  const sepIndex = notes.indexOf(SEPARATOR);
  const first = sepIndex === -1 ? notes : notes.slice(0, sepIndex);
  const rest = sepIndex === -1 ? '' : notes.slice(sepIndex + SEPARATOR.length);
  if ((DONENESS_OPTIONS as readonly string[]).includes(first)) {
    return { doneness: first, obs: rest.trim() || null };
  }
  return { doneness: null, obs: notes.trim() || null };
}

// Categorias cujo nome contenha uma destas palavras pedem o ponto da carne no PDV.
// Para ajustar quais categorias perguntam, basta editar este array.
export const DONENESS_CATEGORY_KEYWORDS = ['espet', 'carne', 'churras'];

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/** Produtos de carne/espeto perguntam o ponto; bebidas e demais categorias não. */
export function productNeedsDoneness(category: string | null | undefined): boolean {
  if (!category) return false;
  const cat = normalize(category);
  return DONENESS_CATEGORY_KEYWORDS.some((kw) => cat.includes(kw));
}
