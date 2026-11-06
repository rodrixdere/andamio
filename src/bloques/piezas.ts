import type { Direccion, Estado } from '../tipos';

/** Caja dentro del bloque: posición y tamaño en fracciones de bloque. */
export type Caja = [x: number, y: number, z: number, ancho: number, alto: number, fondo: number];

/** Bloques que no llenan la celda. En el plano se dibujan más chicos para distinguirlos. */
export const FINOS =
  /fence(?!_gate)|_wall$|chain|pane|iron_bars|_button|lever|tripwire|lantern|candle|potted|flower|sapling|dandelion|oxeye|poppy|tulip|^short_grass|tall_grass|fern|vine|bush|turtle_egg|torch|rod|pickle/;

const OPUESTO: Record<Direccion, Direccion> = { north: 'south', south: 'north', east: 'west', west: 'east' };
const A_LA_DERECHA: Record<Direccion, Direccion> = { north: 'east', east: 'south', south: 'west', west: 'north' };

// Una lámina pegada a uno de los lados del bloque
function lamina(lado: Direccion, grosor: number, alto = 1): Caja {
  switch (lado) {
    case 'north':
      return [0, 0, 0, 1, alto, grosor];
    case 'south':
      return [0, 0, 1 - grosor, 1, alto, grosor];
    case 'west':
      return [0, 0, 0, grosor, alto, 1];
    case 'east':
      return [1 - grosor, 0, 0, grosor, alto, 1];
  }
}

// Lo que cuelga de una pared mira hacia afuera: queda pegado al lado contrario de su "facing"
function ladoDePared({ props: p }: Estado): Direccion {
  if (p.facing && p.facing in OPUESTO) return OPUESTO[p.facing as Direccion];
  for (const lado of ['north', 'south', 'east', 'west'] as const) if (p[lado] === 'true') return lado;
  return 'west';
}

/**
 * Forma aproximada del bloque para el 3D, armada con una o dos cajas.
 * No busca ser exacta: alcanza con que se lea qué va dónde.
 */
export function piezas(e: Estado): Caja[] {
  const { base: b, props: p } = e;
  const dir = p.facing as Direccion;

  if (b.endsWith('_slab')) {
    if (p.type === 'top') return [[0, 0.5, 0, 1, 0.5, 1]];
    if (p.type === 'bottom') return [[0, 0, 0, 1, 0.5, 1]];
    return [[0, 0, 0, 1, 1, 1]];
  }
  if (b.endsWith('_stairs')) {
    // Media altura entera y el escalón alto del lado hacia el que sube
    const arriba = p.half === 'top';
    const escalon = lamina(dir ?? 'north', 0.5, 0.5);
    escalon[1] = arriba ? 0 : 0.5;
    return [[0, arriba ? 0.5 : 0, 0, 1, 0.5, 1], escalon];
  }
  if (/carpet|pressure_plate|^snow$|lily_pad|rail/.test(b)) return [[0, 0, 0, 1, 0.07, 1]];
  if (b.includes('fence_gate')) return [[0, 0.3, 0.4, 1, 0.7, 0.2]];
  if (/fence|_wall$|chain|iron_bars|rod/.test(b)) return [[0.35, 0, 0.35, 0.3, 1, 0.3]];
  if (b.includes('pane')) {
    return p.north === 'true' || p.south === 'true' ? [[0.44, 0, 0, 0.12, 1, 1]] : [[0, 0, 0.44, 1, 1, 0.12]];
  }
  if (b.endsWith('_door')) return [lamina(p.open === 'true' ? A_LA_DERECHA[dir] : OPUESTO[dir], 0.19)];
  if (b.endsWith('trapdoor')) {
    if (p.open === 'true') return [lamina(OPUESTO[dir], 0.19)];
    return [p.half === 'top' ? [0, 0.81, 0, 1, 0.19, 1] : [0, 0, 0, 1, 0.19, 1]];
  }
  if (/wall_banner|wall_sign|ladder|^vine$|_button|lever|tripwire|wall_torch/.test(b)) {
    return [lamina(ladoDePared(e), 0.1, /button|lever|tripwire|torch/.test(b) ? 0.5 : 1)];
  }
  if (b.endsWith('_bed')) return [[0, 0, 0, 1, 0.56, 1]];
  if (/lantern|candle|potted|turtle_egg|cake|bell|torch|pickle/.test(b)) return [[0.3, 0, 0.3, 0.4, 0.55, 0.4]];
  if (FINOS.test(b) || /wheat|carrots|potatoes|beetroots|nether_wart/.test(b)) return [[0.2, 0, 0.2, 0.6, 0.8, 0.6]];
  if (/campfire|enchanting|daylight/.test(b)) return [[0, 0, 0, 1, 0.6, 1]];
  if (b.includes('chest')) return [[0.06, 0, 0.06, 0.88, 0.88, 0.88]];
  return [[0, 0, 0, 1, 1, 1]];
}
