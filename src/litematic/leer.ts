import type { Build } from '../tipos';
import { leerNbt, type NbtCompuesto } from './nbt';

const AIRE = /^minecraft:(cave_|void_)?air$/;

export async function descomprimir(datos: ArrayBuffer): Promise<Uint8Array> {
  const flujo = new Blob([datos]).stream().pipeThrough(new DecompressionStream('gzip'));
  try {
    return new Uint8Array(await new Response(flujo).arrayBuffer());
  } catch {
    // El navegador solo dice "Failed to fetch", que no le sirve a nadie
    throw new Error('El archivo está dañado o incompleto.');
  }
}

function textoDeEstado(e: NbtCompuesto): string {
  const props = (e.Properties ?? {}) as Record<string, string>;
  const claves = Object.keys(props).sort();
  return String(e.Name) + (claves.length ? `[${claves.map(k => `${k}=${props[k]}`).join(',')}]` : '');
}

function xyz(v: NbtCompuesto): [number, number, number] {
  return [Number(v.x), Number(v.y), Number(v.z)];
}

/**
 * Lee un `.litematic` y lo deja como una sola grilla recortada a los bloques que no son aire.
 * Si el archivo tiene varias regiones, se juntan en el mismo espacio.
 */
export async function leerLitematic(datos: ArrayBuffer, nombreArchivo = ''): Promise<Build> {
  const raiz = leerNbt(await descomprimir(datos));
  const regiones = raiz.Regions as Record<string, NbtCompuesto> | undefined;
  if (!regiones) throw new Error('No parece un archivo de Litematica.');

  const bloques = new Map<string, string>();
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];

  for (const region of Object.values(regiones)) {
    const tam = xyz(region.Size as NbtCompuesto);
    const pos = xyz(region.Position as NbtCompuesto);
    // Un tamaño negativo quiere decir que la región crece hacia el lado contrario de su esquina
    const largo = tam.map(Math.abs);
    const origen = tam.map((n, i) => pos[i] + (n < 0 ? n + 1 : 0));
    const paleta = (region.BlockStatePalette as NbtCompuesto[]).map(textoDeEstado);
    const estados = region.BlockStates as BigUint64Array;

    // Litematica empaqueta los índices sin dejar huecos: un índice puede quedar partido entre dos longs
    const bits = BigInt(Math.max(2, Math.ceil(Math.log2(paleta.length))));
    const mascara = (1n << bits) - 1n;
    const total = largo[0] * largo[1] * largo[2];

    for (let i = 0; i < total; i++) {
      const inicio = BigInt(i) * bits;
      const n = Number(inicio >> 6n);
      const corrimiento = inicio & 63n;
      let v = estados[n] >> corrimiento;
      if (corrimiento + bits > 64n) v |= estados[n + 1] << (64n - corrimiento);
      const nombre = paleta[Number(v & mascara)];
      if (!nombre || AIRE.test(nombre)) continue;

      const x = i % largo[0];
      const z = Math.floor(i / largo[0]) % largo[2];
      const y = Math.floor(i / (largo[0] * largo[2]));
      const c = [origen[0] + x, origen[1] + y, origen[2] + z];
      for (let k = 0; k < 3; k++) {
        min[k] = Math.min(min[k], c[k]);
        max[k] = Math.max(max[k], c[k]);
      }
      bloques.set(c.join(','), nombre);
    }
  }
  if (!bloques.size) throw new Error('El archivo no tiene bloques.');

  const [ancho, alto, fondo] = [0, 1, 2].map(k => max[k] - min[k] + 1);
  const paleta = [...new Set(bloques.values())].sort();
  const indice = new Map(paleta.map((n, i) => [n, i + 1]));
  const celdas = new Uint16Array(ancho * alto * fondo);
  for (const [clave, nombre] of bloques) {
    const [x, y, z] = clave.split(',').map(Number);
    celdas[((y - min[1]) * fondo + (z - min[2])) * ancho + (x - min[0])] = indice.get(nombre)!;
  }

  const meta = (raiz.Metadata ?? {}) as NbtCompuesto;
  return {
    id: 'b' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    nombre: String(meta.Name ?? '') || nombreArchivo.replace(/\.litematic$/i, '') || 'Sin nombre',
    autor: String(meta.Author ?? ''),
    tam: [ancho, alto, fondo],
    paleta,
    celdas,
    bloques: bloques.size,
  };
}
