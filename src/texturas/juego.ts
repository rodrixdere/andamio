import type { Cara, Estado } from '../tipos';
import { MADERAS } from '../bloques/estado';

// Texturas sacadas del .jar de Minecraft o de un resource pack. Se procesan en el navegador:
// la página no trae ni sube ninguna imagen del juego.

const RUTA = /^assets\/minecraft\/textures\/block\/[^/]+\.png$/;

// En el juego estas texturas vienen en gris y el bioma las tiñe; se usa el verde de las llanuras
const TINTE: Record<string, string> = {
  grass_block_top: '#7cbd6b',
  short_grass: '#7cbd6b',
  grass: '#7cbd6b',
  tall_grass_top: '#7cbd6b',
  tall_grass_bottom: '#7cbd6b',
  fern: '#7cbd6b',
  large_fern_top: '#7cbd6b',
  large_fern_bottom: '#7cbd6b',
  vine: '#6aa84f',
  lily_pad: '#208030',
  oak_leaves: '#59ae30',
  jungle_leaves: '#59ae30',
  acacia_leaves: '#59ae30',
  dark_oak_leaves: '#59ae30',
  mangrove_leaves: '#59ae30',
  spruce_leaves: '#619961',
  birch_leaves: '#80a755',
};

const CON_TAPA =
  /^(barrel|furnace|smoker|blast_furnace|crafting_table|cartography_table|fletching_table|smithing_table|composter|beehive|lectern|hay_block|dirt_path|farmland)$/;

/** Archivos que podrían tener la textura de este bloque, del más probable al menos. */
export function candidatos({ base: b, props: p }: Estado, cara: Cara): string[] {
  const lista: string[] = [];
  const arriba = cara === 'arriba';
  const material = b.replace(/_(stairs|slab|wall|fence_gate|fence|button|pressure_plate)$/, '');

  if (b === 'grass_block') lista.push(arriba ? 'grass_block_top' : 'grass_block_side');
  if (/_log$|_stem$/.test(b)) lista.push((p.axis === 'y') === arriba ? b + '_top' : b);
  if (/_wood$/.test(b)) lista.push(b.replace(/_wood$/, '_log'));
  if (/_hyphae$/.test(b)) lista.push(b.replace(/_hyphae$/, '_stem'));
  if (b.endsWith('_door') || b === 'tall_grass' || b === 'large_fern')
    lista.push(b + (p.half === 'upper' ? '_top' : '_bottom'));
  if (b.endsWith('_carpet')) lista.push(b.replace('_carpet', '_wool'));
  if (b.endsWith('_pane')) lista.push(b.replace('_pane', ''));
  if (b.startsWith('potted_')) lista.push(b.slice('potted_'.length));
  if (b === 'cauldron' || b === 'water_cauldron') lista.push(arriba ? 'cauldron_top' : 'cauldron_side');
  if (b === 'bookshelf') lista.push(arriba ? 'oak_planks' : 'bookshelf');
  if (b === 'short_grass') lista.push('grass');
  if (CON_TAPA.test(b)) lista.push(b + (arriba ? '_top' : '_side'), b + '_front');

  if (material !== b) {
    if (MADERAS[material.replace(/^stripped_/, '')]) lista.push(material + '_planks');
    lista.push(/(brick|tile)$/.test(material) ? material + 's' : material, material + '_top');
  }
  if (/_trapdoor$/.test(b)) lista.push(b);

  lista.push(b, b + (arriba ? '_top' : '_side'), b + '_side', b + '_top');
  return lista;
}

async function aLienzo(imagen: Blob, nombre: string): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(imagen);
  const lienzo = document.createElement('canvas');
  lienzo.width = lienzo.height = 16;
  const g = lienzo.getContext('2d')!;
  g.imageSmoothingEnabled = false;
  // Las texturas animadas vienen apiladas en vertical; alcanza con el primer cuadro
  const lado = Math.min(bitmap.width, bitmap.height);
  g.drawImage(bitmap, 0, 0, bitmap.width, lado, 0, 0, 16, 16);
  const tinte = TINTE[nombre];
  if (tinte) {
    g.globalCompositeOperation = 'multiply';
    g.fillStyle = tinte;
    g.fillRect(0, 0, 16, 16);
    // multiply pinta también lo transparente; se recupera el contorno original
    g.globalCompositeOperation = 'destination-in';
    g.drawImage(bitmap, 0, 0, bitmap.width, lado, 0, 0, 16, 16);
  }
  return lienzo;
}

export type Paquete = Record<string, Blob>;

/** Saca del .jar o del .zip solo las texturas de bloques. */
export async function extraerPaquete(archivo: Blob): Promise<Paquete> {
  const { default: JSZip } = await import('jszip');
  const zip = await JSZip.loadAsync(archivo).catch(() => {
    throw new Error('No es un .jar ni un .zip válido.');
  });
  const archivos = zip.file(RUTA);
  if (!archivos.length) throw new Error('Ese archivo no trae texturas de bloques (assets/minecraft/textures/block).');
  const paquete: Paquete = {};
  for (const f of archivos) paquete[f.name.slice(f.name.lastIndexOf('/') + 1, -4)] = await f.async('blob');
  return paquete;
}

export class TexturasDelJuego {
  private lienzos = new Map<string, HTMLCanvasElement>();

  get cantidad() {
    return this.lienzos.size;
  }

  async usar(paquete: Paquete) {
    const nuevos = new Map<string, HTMLCanvasElement>();
    for (const [nombre, imagen] of Object.entries(paquete)) {
      try {
        nuevos.set(nombre, await aLienzo(imagen, nombre));
      } catch {
        // Alguna textura rota en un resource pack no tiene por qué frenar el resto
      }
    }
    this.lienzos = nuevos;
  }

  buscar(estado: Estado, cara: Cara): HTMLCanvasElement | null {
    for (const nombre of candidatos(estado, cara)) {
      const lienzo = this.lienzos.get(nombre);
      if (lienzo) return lienzo;
    }
    return null;
  }
}
