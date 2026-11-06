import type { Build } from '../tipos';

/**
 * Formato liviano para guardar un build en JSON (lo usa `public/ejemplo.json`).
 * Las celdas van en tramos de "valor.repeticiones" en base 36, porque la mayor parte de un build es aire.
 */
export interface BuildCompacto {
  nombre: string;
  autor: string;
  tam: [number, number, number];
  paleta: string[];
  rle: string;
}

export function comprimir(b: Build): BuildCompacto {
  const tramos: string[] = [];
  let i = 0;
  while (i < b.celdas.length) {
    const v = b.celdas[i];
    let n = 1;
    while (i + n < b.celdas.length && b.celdas[i + n] === v) n++;
    tramos.push(v.toString(36) + (n > 1 ? '.' + n.toString(36) : ''));
    i += n;
  }
  return { nombre: b.nombre, autor: b.autor, tam: b.tam, paleta: b.paleta, rle: tramos.join(' ') };
}

export function descomprimir(c: BuildCompacto, id: string): Build {
  const [ancho, alto, fondo] = c.tam;
  const celdas = new Uint16Array(ancho * alto * fondo);
  let i = 0;
  for (const tramo of c.rle.split(' ')) {
    const [valor, veces] = tramo.split('.');
    const n = veces ? parseInt(veces, 36) : 1;
    celdas.fill(parseInt(valor, 36), i, i + n);
    i += n;
  }
  if (i !== celdas.length) throw new Error('El build guardado está incompleto.');
  const bloques = celdas.reduce((t, v) => t + (v ? 1 : 0), 0);
  return { id, nombre: c.nombre, autor: c.autor, tam: c.tam, paleta: c.paleta, celdas, bloques };
}
