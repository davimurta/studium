import type { RoadmapItemRow, RoadmapStep } from "@/lib/data/roadmaps";

// Lista "achatada" da arvore: etapas principais (depth 0) seguidas das subetapas (depth 1).
export type FlatItem = { id: string; depth: 0 | 1; item: RoadmapItemRow };

export const MAX_DEPTH = 1;

export function flatten(steps: RoadmapStep[]): FlatItem[] {
  const flat: FlatItem[] = [];
  for (const { children, ...step } of steps) {
    flat.push({ id: step.id, depth: 0, item: step });
    for (const child of children) flat.push({ id: child.id, depth: 1, item: child });
  }
  return flat;
}

export function childIdsOf(flat: FlatItem[], id: string): string[] {
  const index = flat.findIndex((f) => f.id === id);
  if (index < 0 || flat[index].depth !== 0) return [];
  const ids: string[] = [];
  for (let i = index + 1; i < flat.length && flat[i].depth === 1; i++) ids.push(flat[i].id);
  return ids;
}

// Rotulos "01", "01.1", "01.2", "02"...
export function labels(flat: FlatItem[]): Map<string, string> {
  const map = new Map<string, string>();
  let main = 0;
  let child = 0;
  for (const f of flat) {
    if (f.depth === 0) {
      main++;
      child = 0;
      map.set(f.id, String(main).padStart(2, "0"));
    } else {
      child++;
      map.set(f.id, `${String(Math.max(main, 1)).padStart(2, "0")}.${child}`);
    }
  }
  return map;
}

function arrayMove<T>(list: T[], from: number, to: number): T[] {
  const copy = list.slice();
  const [moved] = copy.splice(from, 1);
  copy.splice(to, 0, moved);
  return copy;
}

/*
  Calcula onde o item arrastado vai cair e com que profundidade, a partir
  do deslocamento horizontal (cada `indent` px para a direita = um nivel).
  - Nao pode ficar mais fundo que o item acima + 1 (nem passar de MAX_DEPTH).
  - Nao pode ficar mais raso que o item abaixo (para nao "roubar" subetapas).
  - Etapa com subetapas nao vira subetapa (seria um segundo nivel).
*/
export function projectDepth(
  flat: FlatItem[],
  activeId: string,
  overId: string,
  offsetX: number,
  indent: number,
  activeHasChildren: boolean,
): 0 | 1 {
  const activeIndex = flat.findIndex((f) => f.id === activeId);
  const overIndex = flat.findIndex((f) => f.id === overId);
  if (activeIndex < 0 || overIndex < 0) return 0;

  const moved = arrayMove(flat, activeIndex, overIndex);
  const previous = moved[overIndex - 1];
  const next = moved[overIndex + 1];
  const projected = flat[activeIndex].depth + Math.round(offsetX / indent);
  const maxDepth = activeHasChildren || !previous ? 0 : Math.min(previous.depth + 1, MAX_DEPTH);
  const minDepth = next ? next.depth : 0;
  // Se os limites conflitarem, o maximo vence (nunca cria um segundo nivel).
  return Math.min(maxDepth, Math.max(minDepth, projected, 0)) as 0 | 1;
}

// Aplica o resultado do arraste: move o item (com as subetapas dele) e define a profundidade.
export function applyMove(
  flat: FlatItem[],
  activeId: string,
  overId: string,
  depth: 0 | 1,
): FlatItem[] {
  const children = new Set(childIdsOf(flat, activeId));
  const withoutChildren = flat.filter((f) => !children.has(f.id));
  const from = withoutChildren.findIndex((f) => f.id === activeId);
  const to = withoutChildren.findIndex((f) => f.id === overId);
  if (from < 0 || to < 0) return flat;
  const moved = arrayMove(withoutChildren, from, to).map((f) => (f.id === activeId ? { ...f, depth } : f));
  const at = moved.findIndex((f) => f.id === activeId);
  const childItems = flat.filter((f) => children.has(f.id));
  moved.splice(at + 1, 0, ...childItems);
  return moved;
}

// Recuar para dentro da etapa principal de cima (vira a ultima subetapa dela).
export function indent(flat: FlatItem[], id: string): FlatItem[] | null {
  const index = flat.findIndex((f) => f.id === id);
  if (index <= 0 || flat[index].depth !== 0 || childIdsOf(flat, id).length > 0) return null;
  return flat.map((f) => (f.id === id ? { ...f, depth: 1 } : f));
}

// Tirar de dentro da etapa principal: vira etapa principal logo depois do grupo.
export function outdent(flat: FlatItem[], id: string): FlatItem[] | null {
  const index = flat.findIndex((f) => f.id === id);
  if (index < 0 || flat[index].depth !== 1) return null;
  let end = index;
  while (end + 1 < flat.length && flat[end + 1].depth === 1) end++;
  const copy = flat.slice();
  const [item] = copy.splice(index, 1);
  copy.splice(end, 0, { ...item, depth: 0 });
  return copy;
}
