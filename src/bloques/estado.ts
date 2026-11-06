import type { Estado } from '../tipos';

/** `minecraft:oak_stairs[facing=east,half=top]` → `{ base: 'oak_stairs', props: { facing: 'east', half: 'top' } }` */
export function leerEstado(texto: string): Estado {
  const m = texto.match(/^(?:[a-z0-9_.-]+:)?([a-z0-9_]+)(?:\[(.*)\])?$/);
  if (!m) return { base: texto, props: {} };
  const props: Record<string, string> = {};
  for (const par of (m[2] ?? '').split(',')) {
    if (!par) continue;
    const [k, v] = par.split('=');
    props[k] = v;
  }
  return { base: m[1], props };
}

export const MADERAS: Record<string, string> = {
  oak: 'roble',
  spruce: 'abeto',
  birch: 'abedul',
  jungle: 'jungla',
  acacia: 'acacia',
  dark_oak: 'roble oscuro',
  mangrove: 'mangle',
  cherry: 'cerezo',
  bamboo: 'bambú',
  crimson: 'carmesí',
  warped: 'distorsionado',
  pale_oak: 'roble pálido',
};

export const esDeMadera = (base: string) =>
  Object.keys(MADERAS).some(m => base.startsWith(m + '_') || base.startsWith('stripped_' + m + '_'));
