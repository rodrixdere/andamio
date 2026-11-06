import type { Cara, Estado } from '../tipos';
import { texturaDibujada } from './dibujadas';
import { TexturasDelJuego } from './juego';

export const delJuego = new TexturasDelJuego();

let usarDelJuego = false;

export const usandoDelJuego = () => usarDelJuego && delJuego.cantidad > 0;

export function elegirFuente(juego: boolean) {
  usarDelJuego = juego;
}

/** La textura que corresponde mostrar ahora: la del juego si hay y está elegida, si no la dibujada. */
export function textura(estado: Estado, cara: Cara): HTMLCanvasElement {
  return (usandoDelJuego() && delJuego.buscar(estado, cara)) || texturaDibujada(estado.base);
}
