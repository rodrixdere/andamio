// Lector de NBT, el formato binario de Minecraft. Solo lectura y big endian, que es lo que usa Litematica.

export type Nbt = number | bigint | string | Uint8Array | Int32Array | BigUint64Array | Nbt[] | NbtCompuesto;
export interface NbtCompuesto {
  [clave: string]: Nbt;
}

export function leerNbt(bytes: Uint8Array): NbtCompuesto {
  const vista = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const texto = new TextDecoder();
  let p = 0;

  const cadena = (): string => {
    const largo = vista.getUint16(p);
    p += 2;
    const s = texto.decode(bytes.subarray(p, p + largo));
    p += largo;
    return s;
  };

  const valor = (tipo: number): Nbt => {
    switch (tipo) {
      case 1:
        return vista.getInt8(p++);
      case 2:
        p += 2;
        return vista.getInt16(p - 2);
      case 3:
        p += 4;
        return vista.getInt32(p - 4);
      case 4:
        p += 8;
        return vista.getBigInt64(p - 8);
      case 5:
        p += 4;
        return vista.getFloat32(p - 4);
      case 6:
        p += 8;
        return vista.getFloat64(p - 8);
      case 7: {
        const n = vista.getInt32(p);
        p += 4 + n;
        return bytes.subarray(p - n, p);
      }
      case 8:
        return cadena();
      case 9: {
        const tipoHijos = vista.getInt8(p);
        const n = vista.getInt32(p + 1);
        p += 5;
        const lista: Nbt[] = [];
        for (let i = 0; i < n; i++) lista.push(valor(tipoHijos));
        return lista;
      }
      case 10: {
        const obj: NbtCompuesto = {};
        for (;;) {
          const t = vista.getInt8(p++);
          if (t === 0) return obj;
          const clave = cadena();
          obj[clave] = valor(t);
        }
      }
      case 11: {
        const n = vista.getInt32(p);
        p += 4;
        const arr = new Int32Array(n);
        for (let i = 0; i < n; i++, p += 4) arr[i] = vista.getInt32(p);
        return arr;
      }
      case 12: {
        // Sin signo: los estados de bloque se leen como bits, el signo no significa nada
        const n = vista.getInt32(p);
        p += 4;
        const arr = new BigUint64Array(n);
        for (let i = 0; i < n; i++, p += 8) arr[i] = vista.getBigUint64(p);
        return arr;
      }
      default:
        throw new Error(`El archivo tiene un dato que no reconozco (tipo ${tipo}).`);
    }
  };

  const tipoRaiz = vista.getInt8(p++);
  if (tipoRaiz !== 10) throw new Error('El archivo no empieza como un NBT válido.');
  cadena();
  return valor(tipoRaiz) as NbtCompuesto;
}
