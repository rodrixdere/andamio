/** Un build ya leído: la grilla entera con un índice de paleta por celda. */
export interface Build {
  id: string;
  nombre: string;
  autor: string;
  /** Ancho (x, oeste a este), alto (y) y fondo (z, norte a sur). */
  tam: [number, number, number];
  /** Estados de bloque tal como los escribe el juego, por ejemplo `minecraft:oak_stairs[facing=east,...]`. */
  paleta: string[];
  /** `paleta[celdas[i] - 1]`; el 0 es aire. Orden: capa, después fila (z), después columna (x). */
  celdas: Uint16Array;
  bloques: number;
  ejemplo?: boolean;
}

export interface Estado {
  base: string;
  props: Record<string, string>;
}

/** Ítem y cantidad que hay que tener en el inventario para colocar un bloque. */
export type Item = [clave: string, cantidad: number];

export type Cara = 'arriba' | 'lado';

export type Direccion = 'north' | 'south' | 'east' | 'west';
