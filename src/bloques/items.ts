import type { Estado, Item } from '../tipos';

// Bloques que en el inventario son otro ítem
const COMO_ITEM: Record<string, string> = {
  wheat: 'wheat_seeds',
  carrots: 'carrot',
  potatoes: 'potato',
  beetroots: 'beetroot_seeds',
  cocoa: 'cocoa_beans',
  sweet_berry_bush: 'sweet_berries',
  redstone_wire: 'redstone',
  flowering_azalea_bush: 'flowering_azalea',
  azalea_bush: 'azalea',
  wall_torch: 'torch',
  soul_wall_torch: 'soul_torch',
  redstone_wall_torch: 'redstone_torch',
  water_cauldron: 'cauldron',
  lava_cauldron: 'cauldron',
  powder_snow_cauldron: 'cauldron',
};

const PLANTAS_DOBLES = /^(tall_grass|large_fern|sunflower|lilac|rose_bush|peony|tall_seagrass|pitcher_plant)$/;

/**
 * Qué hay que tener en el inventario para colocar este bloque. Cuenta ítems, no bloques:
 * una puerta ocupa dos bloques y es un ítem; una losa doble son dos losas.
 */
export function itemsDe({ base: b, props: p }: Estado): Item[] {
  if (p.half === 'upper' && (b.endsWith('_door') || PLANTAS_DOBLES.test(b))) return [];
  if (b.endsWith('_bed') && p.part === 'head') return [];
  if (b === 'piston_head' || b === 'moving_piston') return [];

  if (b.endsWith('_slab') && p.type === 'double') return [[b, 2]];
  if (b.startsWith('potted_')) {
    const planta = b.slice('potted_'.length);
    return [
      ['flower_pot', 1],
      [COMO_ITEM[planta] ?? planta, 1],
    ];
  }
  if (b.endsWith('_wall_banner')) return [[b.replace('_wall_banner', '_banner'), 1]];
  if (b.endsWith('_wall_hanging_sign')) return [[b.replace('_wall_hanging_sign', '_hanging_sign'), 1]];
  if (b.endsWith('_wall_sign')) return [[b.replace('_wall_sign', '_sign'), 1]];

  // Bloques que guardan varias unidades en uno
  if (b.endsWith('candle') && p.candles) return [[b, Number(p.candles)]];
  if (b === 'turtle_egg' || b === 'sniffer_egg') return [[b, Number(p.eggs ?? 1)]];
  if (b === 'sea_pickle') return [[b, Number(p.pickles ?? 1)]];
  if (b === 'snow' && p.layers) return [[b, Number(p.layers)]];

  return [[COMO_ITEM[b] ?? b, 1]];
}

export function porStack(clave: string): number {
  if (/_bed$|^cake$|_boat$/.test(clave)) return 1;
  if (/_banner$|_sign$|^turtle_egg$|^ender_pearl$|^snowball$/.test(clave)) return 16;
  return 64;
}

/** "16 stacks de 64 + 36", o vacío si no llega a un stack. */
export function textoStacks(clave: string, cantidad: number): string {
  const tam = porStack(clave);
  if (cantidad < tam) return '';
  const llenos = Math.floor(cantidad / tam);
  const resto = cantidad % tam;
  return `${llenos} stack${llenos > 1 ? 's' : ''} de ${tam}${resto ? ' + ' + resto : ''}`;
}
