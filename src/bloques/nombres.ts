import { MADERAS } from './estado';

// Nombres como aparecen en el juego en español. Lo que no está acá se arma con las tablas de abajo.
const FIJOS: Record<string, string> = {
  stripped_spruce_log: 'Tronco de abeto sin corteza',
  calcite: 'Calcita',
  grass_block: 'Bloque de césped',
  dirt: 'Tierra',
  coarse_dirt: 'Tierra estéril',
  dirt_path: 'Camino de tierra',
  farmland: 'Tierra de cultivo',
  diorite: 'Diorita',
  granite: 'Granito',
  andesite: 'Andesita',
  polished_andesite: 'Andesita pulida',
  polished_diorite: 'Diorita pulida',
  polished_granite: 'Granito pulido',
  stone: 'Piedra',
  smooth_stone: 'Piedra lisa',
  cobblestone: 'Roca',
  mossy_cobblestone: 'Roca musgosa',
  stone_bricks: 'Ladrillos de piedra',
  mossy_stone_bricks: 'Ladrillos de piedra musgosos',
  cracked_stone_bricks: 'Ladrillos de piedra agrietados',
  deepslate_bricks: 'Ladrillos de pizarra abismal',
  bricks: 'Ladrillos',
  sand: 'Arena',
  gravel: 'Grava',
  sandstone: 'Arenisca',
  glass: 'Vidrio',
  glass_pane: 'Panel de vidrio',
  lantern: 'Farol',
  soul_lantern: 'Farol de almas',
  torch: 'Antorcha',
  glowstone: 'Piedra luminosa',
  sea_lantern: 'Linterna marina',
  short_grass: 'Hierba',
  grass: 'Hierba',
  tall_grass: 'Hierba alta',
  vine: 'Enredaderas',
  barrel: 'Barril',
  bookshelf: 'Librería',
  chest: 'Cofre',
  trapped_chest: 'Cofre trampa',
  ender_chest: 'Cofre de ender',
  candle: 'Vela',
  flower_pot: 'Maceta',
  iron_chain: 'Cadena',
  chain: 'Cadena',
  iron_bars: 'Barrotes de hierro',
  composter: 'Compostador',
  smoker: 'Ahumador',
  blast_furnace: 'Alto horno',
  furnace: 'Horno',
  crafting_table: 'Mesa de trabajo',
  cartography_table: 'Mesa de cartografía',
  smithing_table: 'Mesa de herrería',
  fletching_table: 'Mesa de flechería',
  enchanting_table: 'Mesa de encantamientos',
  brewing_stand: 'Soporte para pociones',
  hopper: 'Tolva',
  ladder: 'Escalera de mano',
  cauldron: 'Caldero',
  anvil: 'Yunque',
  grindstone: 'Afilador',
  lectern: 'Atril',
  beehive: 'Colmena',
  bell: 'Campana',
  campfire: 'Fogata',
  lever: 'Palanca',
  tripwire_hook: 'Gancho de cuerda trampa',
  hay_block: 'Fardo de heno',
  cake: 'Pastel',
  soul_sand: 'Arena de almas',
  nether_wart: 'Verruga del Nether',
  turtle_egg: 'Huevo de tortuga',
  bamboo: 'Bambú',
  carrot: 'Zanahoria',
  wheat_seeds: 'Semillas de trigo',
  beetroot_seeds: 'Semillas de remolacha',
  dandelion: 'Diente de león',
  poppy: 'Amapola',
  oxeye_daisy: 'Margarita',
  red_tulip: 'Tulipán rojo',
  dead_bush: 'Arbusto muerto',
  azalea: 'Azalea',
  flowering_azalea: 'Azalea florida',
  water: 'Agua',
  lava: 'Lava',
};

const PIEDRAS: Record<string, string> = {
  stone: 'piedra',
  cobblestone: 'roca',
  mossy_cobblestone: 'roca musgosa',
  stone_brick: 'ladrillos de piedra',
  mossy_stone_brick: 'ladrillos de piedra musgosos',
  deepslate_brick: 'ladrillos de pizarra abismal',
  deepslate_tile: 'baldosas de pizarra abismal',
  cobbled_deepslate: 'pizarra abismal labrada',
  polished_deepslate: 'pizarra abismal pulida',
  brick: 'ladrillos',
  sandstone: 'arenisca',
  smooth_sandstone: 'arenisca lisa',
  red_sandstone: 'arenisca roja',
  granite: 'granito',
  diorite: 'diorita',
  andesite: 'andesita',
  polished_granite: 'granito pulido',
  polished_diorite: 'diorita pulida',
  polished_andesite: 'andesita pulida',
  smooth_stone: 'piedra lisa',
  blackstone: 'piedra negra',
  polished_blackstone: 'piedra negra pulida',
  polished_blackstone_brick: 'ladrillos de piedra negra pulida',
  nether_brick: 'ladrillos del Nether',
  end_stone_brick: 'ladrillos de piedra del End',
  quartz: 'cuarzo',
  prismarine: 'prismarina',
  mud_brick: 'ladrillos de barro',
  tuff: 'toba',
};

// [masculino, femenino]
const COLORES: Record<string, [string, string]> = {
  white: ['blanco', 'blanca'],
  orange: ['naranja', 'naranja'],
  magenta: ['magenta', 'magenta'],
  light_blue: ['celeste', 'celeste'],
  yellow: ['amarillo', 'amarilla'],
  lime: ['verde lima', 'verde lima'],
  pink: ['rosa', 'rosa'],
  gray: ['gris', 'gris'],
  light_gray: ['gris claro', 'gris claro'],
  cyan: ['cian', 'cian'],
  purple: ['morado', 'morada'],
  blue: ['azul', 'azul'],
  brown: ['marrón', 'marrón'],
  green: ['verde', 'verde'],
  red: ['rojo', 'roja'],
  black: ['negro', 'negra'],
};

const FORMAS: [sufijo: string, nombre: string][] = [
  ['_stairs', 'Escaleras de '],
  ['_slab', 'Losa de '],
  ['_wall', 'Muro de '],
  ['_fence_gate', 'Puerta de valla de '],
  ['_fence', 'Valla de '],
  ['_trapdoor', 'Trampilla de '],
  ['_door', 'Puerta de '],
  ['_button', 'Botón de '],
  ['_pressure_plate', 'Placa de presión de '],
  ['_planks', 'Tablones de '],
  ['_log', 'Tronco de '],
  ['_wood', 'Madera de '],
  ['_leaves', 'Hojas de '],
  ['_sapling', 'Brote de '],
  ['_sign', 'Cartel de '],
];

// El orden importa: "_stained_glass_pane" tiene que probarse antes que "_stained_glass"
const TENIDOS: [sufijo: string, nombre: string, femenino: boolean][] = [
  ['_carpet', 'Alfombra ', true],
  ['_wool', 'Lana ', true],
  ['_bed', 'Cama ', true],
  ['_candle', 'Vela ', true],
  ['_terracotta', 'Terracota ', true],
  ['_concrete_powder', 'Cemento ', false],
  ['_concrete', 'Hormigón ', false],
  ['_stained_glass_pane', 'Panel de vidrio ', false],
  ['_stained_glass', 'Vidrio ', false],
  ['_banner', 'Estandarte ', false],
];

export function nombreItem(clave: string): string {
  if (FIJOS[clave]) return FIJOS[clave];

  let base = clave;
  let sinCorteza = '';
  if (base.startsWith('stripped_')) {
    base = base.slice('stripped_'.length);
    sinCorteza = ' sin corteza';
  }

  for (const [sufijo, nombre, femenino] of TENIDOS) {
    if (!base.endsWith(sufijo)) continue;
    const color = COLORES[base.slice(0, -sufijo.length)];
    if (color) return nombre + color[femenino ? 1 : 0];
  }
  for (const [sufijo, nombre] of FORMAS) {
    if (!base.endsWith(sufijo)) continue;
    const material = base.slice(0, -sufijo.length);
    const enEspanol = MADERAS[material] ?? PIEDRAS[material] ?? PIEDRAS[material.replace(/s$/, '')];
    if (enEspanol) return nombre + enEspanol + sinCorteza;
  }
  // Sin traducción: el id del juego, legible
  return clave.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase());
}

export const NOTAS: Record<string, string> = {
  farmland: 'tierra + azada',
  dirt_path: 'tierra + pala',
  grass_block: 'se saca con toque de seda',
  water: 'balde de agua',
  lava: 'balde de lava',
};
