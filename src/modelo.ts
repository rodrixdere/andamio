import type { Build, Estado, Item } from './tipos';
import { leerEstado } from './bloques/estado';
import { itemsDe } from './bloques/items';

/** Un build listo para dibujar: con la paleta ya leída y los ítems de cada estado calculados una vez. */
export class BuildAbierto {
  readonly ancho: number;
  readonly alto: number;
  readonly fondo: number;
  readonly estados: Estado[];
  readonly items: Item[][];
  /** Ítems que el usuario apagó; sus bloques no se dibujan pero siguen contando en los materiales. */
  ocultos = new Set<string>();
  private apagado: boolean[] = [];

  constructor(readonly datos: Build) {
    [this.ancho, this.alto, this.fondo] = datos.tam;
    this.estados = datos.paleta.map(leerEstado);
    this.items = this.estados.map(itemsDe);
  }

  ocultar(claves: Iterable<string>) {
    this.ocultos = new Set(claves);
    this.apagado = this.items.map(lista => lista.some(([k]) => this.ocultos.has(k)));
  }

  /** Índice en la paleta + 1, o 0 si es aire o está oculto. */
  celda(x: number, y: number, z: number): number {
    const i = this.datos.celdas[(y * this.fondo + z) * this.ancho + x];
    return i && this.apagado[i - 1] ? 0 : i;
  }

  /** Si el bloque en esa posición de `celdas` se dibuja: no es aire y no está oculto. */
  visible(lugar: number): boolean {
    const i = this.datos.celdas[lugar];
    return i > 0 && !this.apagado[i - 1];
  }

  /** Nombre del ítem que se coloca en ese lugar de la paleta. */
  clave(indice: number): string {
    return this.items[indice - 1][0]?.[0] ?? this.estados[indice - 1].base;
  }

  estado(indice: number): Estado {
    return this.estados[indice - 1];
  }

  /** Ítems que llevan las capas de `desde` a `hasta`, de más a menos. */
  materiales(desde: number, hasta: number): Item[] {
    const total = new Map<string, number>();
    const porCapa = this.ancho * this.fondo;
    for (let i = desde * porCapa; i < (hasta + 1) * porCapa; i++) {
      const v = this.datos.celdas[i];
      if (!v) continue;
      for (const [clave, n] of this.items[v - 1]) total.set(clave, (total.get(clave) ?? 0) + n);
    }
    return [...total].sort((a, b) => b[1] - a[1]);
  }

  /** Algún estado de la paleta que se coloque como este ítem, para mostrar su textura. */
  estadoDeItem(clave: string): Estado {
    const i = this.items.findIndex(lista => lista.some(([k]) => k === clave));
    return i >= 0 ? this.estados[i] : { base: clave, props: {} };
  }
}
