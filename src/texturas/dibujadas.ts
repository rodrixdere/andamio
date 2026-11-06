import { colorDe } from '../bloques/colores';
import { esDeMadera } from '../bloques/estado';

// Texturas propias de 16 × 16. No copian las del juego: buscan que cada material se reconozca de un vistazo.

type Patron =
  | 'tablones'
  | 'corteza'
  | 'ladrillos'
  | 'roca'
  | 'piedra'
  | 'tierra'
  | 'lana'
  | 'hojas'
  | 'vidrio'
  | 'cesped'
  | 'libros'
  | 'liso';

export function patronDe(base: string): Patron {
  if (base.includes('leaves')) return 'hojas';
  if (/_log$|_wood$|_stem$|_hyphae$/.test(base)) return 'corteza';
  if (esDeMadera(base)) return 'tablones';
  if (/brick|tile/.test(base)) return 'ladrillos';
  if (base.includes('cobble')) return 'roca';
  if (/glass|ice/.test(base)) return 'vidrio';
  if (/wool|carpet|_bed$/.test(base)) return 'lana';
  if (base === 'grass_block') return 'cesped';
  if (/dirt|farmland|soul|gravel|sand$|podzol|mud$/.test(base)) return 'tierra';
  if (base === 'bookshelf') return 'libros';
  if (/stone|andesite|diorite|granite|calcite|deepslate|tuff|basalt|quartz|prismarine/.test(base)) return 'piedra';
  return 'liso';
}

// Generador con semilla: la misma textura sale igual cada vez que se dibuja
function aleatorio(semilla: number) {
  let s = semilla >>> 0 || 1;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}

const cache = new Map<string, HTMLCanvasElement>();

export function texturaDibujada(base: string): HTMLCanvasElement {
  const patron = patronDe(base);
  const color = colorDe(base);
  const clave = patron + color;
  const guardada = cache.get(clave);
  if (guardada) return guardada;

  const lienzo = document.createElement('canvas');
  lienzo.width = lienzo.height = 16;
  const g = lienzo.getContext('2d')!;
  g.fillStyle = color;
  g.fillRect(0, 0, 16, 16);

  let semilla = 0;
  for (const c of base) semilla = (semilla * 33 + c.charCodeAt(0)) >>> 0;
  const r = aleatorio(semilla);
  const claro = (a: number) => `rgba(255,255,255,${a})`;
  const oscuro = (a: number) => `rgba(0,0,0,${a})`;
  const salpicar = (n: number, fuerza: number) => {
    for (let i = 0; i < n; i++) {
      g.fillStyle = r() < 0.5 ? claro(fuerza) : oscuro(fuerza);
      g.fillRect(Math.floor(r() * 16), Math.floor(r() * 16), 1, 1);
    }
  };

  switch (patron) {
    case 'tablones':
      salpicar(40, 0.08);
      g.fillStyle = oscuro(0.35);
      for (const y of [3, 7, 11, 15]) g.fillRect(0, y, 16, 1);
      // Las uniones de cada tabla, corridas fila por fila
      g.fillStyle = oscuro(0.25);
      for (const [x, y] of [
        [5, 0],
        [12, 4],
        [2, 8],
        [9, 12],
      ])
        g.fillRect(x, y, 1, 3);
      break;
    case 'corteza':
      for (let x = 0; x < 16; x++) {
        g.fillStyle = r() < 0.5 ? oscuro(0.22) : claro(0.06);
        g.fillRect(x, 0, 1, 16);
      }
      salpicar(30, 0.15);
      break;
    case 'ladrillos':
      salpicar(30, 0.08);
      g.fillStyle = oscuro(0.3);
      for (let y = 3; y < 16; y += 4) g.fillRect(0, y, 16, 1);
      for (let fila = 0; fila < 4; fila++) {
        for (let x = fila % 2 ? 4 : 0; x < 16; x += 8) g.fillRect(x, fila * 4, 1, 3);
      }
      break;
    case 'roca':
      salpicar(60, 0.12);
      g.fillStyle = oscuro(0.3);
      for (let i = 0; i < 7; i++) {
        const x = Math.floor(r() * 13);
        const y = Math.floor(r() * 13);
        g.fillRect(x, y, 3 + Math.floor(r() * 2), 1);
        g.fillRect(x, y, 1, 3);
      }
      break;
    case 'piedra':
      salpicar(70, 0.09);
      break;
    case 'tierra':
    case 'cesped':
      salpicar(80, 0.14);
      break;
    case 'lana':
      salpicar(50, 0.06);
      g.fillStyle = oscuro(0.08);
      for (let y = 0; y < 16; y += 2) g.fillRect(0, y, 16, 1);
      break;
    case 'hojas':
      salpicar(70, 0.18);
      g.fillStyle = oscuro(0.45);
      for (let i = 0; i < 18; i++) g.fillRect(Math.floor(r() * 16), Math.floor(r() * 16), 1, 1);
      break;
    case 'vidrio':
      g.clearRect(0, 0, 16, 16);
      g.globalAlpha = 0.35;
      g.fillRect(0, 0, 16, 16);
      g.globalAlpha = 1;
      g.fillStyle = claro(0.8);
      g.fillRect(0, 0, 16, 1);
      g.fillRect(0, 0, 1, 16);
      g.fillStyle = oscuro(0.25);
      g.fillRect(15, 0, 1, 16);
      g.fillRect(0, 15, 16, 1);
      g.fillStyle = claro(0.7);
      for (const [x, y] of [
        [4, 4],
        [5, 5],
        [10, 9],
      ])
        g.fillRect(x, y, 1, 1);
      break;
    case 'libros': {
      const tapas = ['#7a2d2a', '#2e4a73', '#4c6b2a', '#b8892f', '#5a3a6b'];
      for (const y of [1, 9]) {
        for (let x = 1; x < 15; ) {
          const ancho = 1 + Math.floor(r() * 2);
          g.fillStyle = tapas[Math.floor(r() * tapas.length)];
          g.fillRect(x, y, ancho, 6);
          x += ancho + (r() < 0.3 ? 1 : 0);
        }
      }
      break;
    }
    default:
      salpicar(30, 0.07);
  }

  cache.set(clave, lienzo);
  return lienzo;
}
