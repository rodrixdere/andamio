import { describe, expect, it } from 'vitest';
import { leerLitematic } from '../src/litematic/leer';
import { comprimir, descomprimir } from '../src/litematic/compacto';
import { armarLitematic } from './armar-litematic';

const AIRE = 'minecraft:air';
const PIEDRA = 'minecraft:stone';
const ROBLE = 'minecraft:oak_planks';

describe('leerLitematic', () => {
  it('lee el nombre, el autor y ubica cada bloque', async () => {
    // 2 × 2 × 2: piedra abajo en una esquina, tablones arriba en la opuesta
    const indices = [1, 0, 0, 0, 0, 0, 0, 2];
    const b = await leerLitematic(armarLitematic([{ tam: [2, 2, 2], paleta: [AIRE, PIEDRA, ROBLE], indices }]));
    expect(b.nombre).toBe('Prueba');
    expect(b.autor).toBe('tests');
    expect(b.tam).toEqual([2, 2, 2]);
    expect(b.bloques).toBe(2);
    expect(b.paleta[b.celdas[0] - 1]).toBe(PIEDRA);
    expect(b.paleta[b.celdas[7] - 1]).toBe(ROBLE);
  });

  it('recorta el aire de alrededor', async () => {
    const indices = new Array(27).fill(0);
    indices[13] = 1; // el centro de un cubo de 3
    const b = await leerLitematic(armarLitematic([{ tam: [3, 3, 3], paleta: [AIRE, PIEDRA], indices }]));
    expect(b.tam).toEqual([1, 1, 1]);
    expect(b.bloques).toBe(1);
  });

  it('lee índices que quedan partidos entre dos longs', async () => {
    // 33 estados: 6 bits por índice, así que varios cruzan el límite de 64 bits
    const paleta = [AIRE, ...Array.from({ length: 32 }, (_, i) => `minecraft:white_wool_${i}`)];
    const indices = Array.from({ length: 40 }, (_, i) => (i % 32) + 1);
    const b = await leerLitematic(armarLitematic([{ tam: [40, 1, 1], paleta, indices }]));
    const leidos = [...b.celdas].map(v => b.paleta[v - 1]);
    expect(leidos).toEqual(indices.map(i => paleta[i]));
  });

  it('respeta las propiedades de cada estado', async () => {
    const escalera = 'minecraft:oak_stairs[facing=east,half=top]';
    const b = await leerLitematic(armarLitematic([{ tam: [1, 1, 1], paleta: [AIRE, escalera], indices: [1] }]));
    expect(b.paleta).toEqual([escalera]);
  });

  it('junta varias regiones, también las de tamaño negativo', async () => {
    const b = await leerLitematic(
      armarLitematic([
        { tam: [1, 1, 1], posicion: [0, 0, 0], paleta: [AIRE, PIEDRA], indices: [1] },
        // Crece hacia x negativo desde x = 3: ocupa x = 2 y x = 3
        { tam: [-2, 1, 1], posicion: [3, 0, 0], paleta: [AIRE, ROBLE], indices: [1, 1] },
      ]),
    );
    expect(b.tam).toEqual([4, 1, 1]);
    expect([...b.celdas].map(v => (v ? b.paleta[v - 1] : null))).toEqual([PIEDRA, null, ROBLE, ROBLE]);
  });

  it('avisa si el archivo no es de Litematica', async () => {
    const { gzipSync } = await import('node:zlib');
    const vacio = gzipSync(Buffer.from([10, 0, 0, 0]));
    await expect(
      leerLitematic(vacio.buffer.slice(vacio.byteOffset, vacio.byteOffset + vacio.byteLength)),
    ).rejects.toThrow(/Litematica/);
  });
});

describe('formato compacto', () => {
  it('ida y vuelta sin perder celdas', async () => {
    const indices = [1, 1, 1, 0, 0, 2, 0, 1];
    const b = await leerLitematic(armarLitematic([{ tam: [2, 2, 2], paleta: [AIRE, PIEDRA, ROBLE], indices }]));
    const vuelta = descomprimir(comprimir(b), 'x');
    expect([...vuelta.celdas]).toEqual([...b.celdas]);
    expect(vuelta.bloques).toBe(b.bloques);
  });
});
