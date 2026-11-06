import { gzipSync } from 'node:zlib';

// Escritor mínimo de NBT para armar archivos .litematic de prueba sin depender de uno real.

type Valor =
  | { t: 'int'; v: number }
  | { t: 'string'; v: string }
  | { t: 'longs'; v: bigint[] }
  | { t: 'lista'; v: Record<string, Valor>[] }
  | { t: 'compuesto'; v: Record<string, Valor> };

const int = (v: number): Valor => ({ t: 'int', v });
const str = (v: string): Valor => ({ t: 'string', v });
const comp = (v: Record<string, Valor>): Valor => ({ t: 'compuesto', v });

const TIPO = { int: 3, string: 8, longs: 12, lista: 9, compuesto: 10 } as const;

function escribir(partes: Buffer[], valor: Valor) {
  const u16 = (n: number) => {
    const b = Buffer.alloc(2);
    b.writeUInt16BE(n);
    partes.push(b);
  };
  const i32 = (n: number) => {
    const b = Buffer.alloc(4);
    b.writeInt32BE(n);
    partes.push(b);
  };
  const cadena = (s: string) => {
    const b = Buffer.from(s, 'utf8');
    u16(b.length);
    partes.push(b);
  };
  switch (valor.t) {
    case 'int':
      return i32(valor.v);
    case 'string':
      return cadena(valor.v);
    case 'longs':
      i32(valor.v.length);
      for (const l of valor.v) {
        const b = Buffer.alloc(8);
        b.writeBigUInt64BE(l);
        partes.push(b);
      }
      return;
    case 'lista':
      partes.push(Buffer.from([TIPO.compuesto]));
      i32(valor.v.length);
      for (const c of valor.v) escribir(partes, comp(c));
      return;
    case 'compuesto':
      for (const [k, v] of Object.entries(valor.v)) {
        partes.push(Buffer.from([TIPO[v.t]]));
        cadena(k);
        escribir(partes, v);
      }
      partes.push(Buffer.from([0]));
  }
}

/** Empaqueta los índices como Litematica: sin huecos, un índice puede cruzar de un long al siguiente. */
export function empaquetar(indices: number[], bits: number): bigint[] {
  const longs = new Array<bigint>(Math.ceil((indices.length * bits) / 64)).fill(0n);
  indices.forEach((v, i) => {
    const inicio = i * bits;
    const n = Math.floor(inicio / 64);
    const corrimiento = BigInt(inicio % 64);
    longs[n] = (longs[n] | (BigInt(v) << corrimiento)) & 0xffffffffffffffffn;
    if (Number(corrimiento) + bits > 64) longs[n + 1] |= BigInt(v) >> (64n - corrimiento);
  });
  return longs;
}

export interface RegionDePrueba {
  tam: [number, number, number];
  posicion?: [number, number, number];
  paleta: string[];
  /** Un índice de paleta por celda, en orden x, después z, después y. */
  indices: number[];
}

export function armarLitematic(regiones: RegionDePrueba[], meta = { nombre: 'Prueba', autor: 'tests' }): ArrayBuffer {
  const regionesNbt: Record<string, Valor> = {};
  regiones.forEach((r, n) => {
    const bits = Math.max(2, Math.ceil(Math.log2(r.paleta.length)));
    const [px, py, pz] = r.posicion ?? [0, 0, 0];
    regionesNbt[`Region ${n + 1}`] = comp({
      Position: comp({ x: int(px), y: int(py), z: int(pz) }),
      Size: comp({ x: int(r.tam[0]), y: int(r.tam[1]), z: int(r.tam[2]) }),
      BlockStatePalette: {
        t: 'lista',
        v: r.paleta.map(s => {
          const m = s.match(/^([^[]+)(?:\[(.*)\])?$/)!;
          const estado: Record<string, Valor> = { Name: str(m[1]) };
          const pares = (m[2] ?? '').split(',').filter(Boolean);
          if (pares.length)
            estado.Properties = comp(Object.fromEntries(pares.map(kv => kv.split('=')).map(([k, v]) => [k, str(v)])));
          return estado;
        }),
      },
      BlockStates: { t: 'longs', v: empaquetar(r.indices, bits) },
    });
  });

  const partes: Buffer[] = [Buffer.from([TIPO.compuesto, 0, 0])];
  escribir(
    partes,
    comp({ Metadata: comp({ Name: str(meta.nombre), Author: str(meta.autor) }), Regions: comp(regionesNbt) }),
  );
  const datos = gzipSync(Buffer.concat(partes));
  return datos.buffer.slice(datos.byteOffset, datos.byteOffset + datos.byteLength);
}
