import type { BuildAbierto } from '../modelo';
import type { Item } from '../tipos';
import { textoStacks } from '../bloques/items';
import { NOTAS, nombreItem } from '../bloques/nombres';
import { textura } from '../texturas';
import { escapar, numero } from './dom';
import { icono } from './iconos';

export type Alcance = 'capa' | 'todo';

const muestras = new Map<string, string>();

export const olvidarMuestras = () => muestras.clear();

export function muestraDe(build: BuildAbierto, clave: string): string {
  let url = muestras.get(clave);
  if (!url) {
    url = textura(build.estadoDeItem(clave), 'lado').toDataURL();
    muestras.set(clave, url);
  }
  return url;
}

function fila(build: BuildAbierto, [clave, n]: Item, resaltado: string | null): string {
  const stacks = textoStacks(clave, n);
  const nota = NOTAS[clave];
  const nombre = escapar(nombreItem(clave));
  const oculto = build.ocultos.has(clave);
  return `<li${oculto ? ' class="oculto"' : ''}><button data-item="${clave}" aria-pressed="${resaltado === clave}">
    <span class="muestra" style="background-image:url(${muestraDe(build, clave)})"></span>
    <span class="mat-nombre">${nombre}${nota ? `<small>${nota}</small>` : ''}</span>
    <span class="mat-cantidad">${numero(n)}${stacks ? `<small>${stacks}</small>` : ''}</span>
  </button><button class="boton-icono mat-ojo" data-ocultar="${clave}" aria-pressed="${oculto}"
    aria-label="${oculto ? 'Mostrar' : 'Ocultar'} ${nombre}" title="${oculto ? 'Mostrar' : 'Ocultar'}">
    ${icono(oculto ? 'ojoCerrado' : 'ojo')}</button></li>`;
}

export function pintarMateriales(
  partes: { resumen: HTMLElement; lista: HTMLElement },
  build: BuildAbierto,
  capa: number,
  alcance: Alcance,
  resaltado: string | null,
) {
  const items = alcance === 'capa' ? build.materiales(capa, capa) : build.materiales(0, build.alto - 1);
  const total = items.reduce((t, [, n]) => t + n, 0);

  partes.resumen.textContent = !items.length
    ? 'Esta capa no lleva bloques.'
    : `${numero(total)} ${total === 1 ? 'ítem' : 'ítems'} de ${items.length} ${items.length === 1 ? 'tipo' : 'tipos'}` +
      (alcance === 'capa' ? ' en la capa. Tocá uno para ubicarlo.' : ' en todo el build.');
  if (build.ocultos.size)
    partes.resumen.insertAdjacentHTML(
      'beforeend',
      ` <button class="enlace" data-mostrar-todos>Mostrar ${build.ocultos.size === 1 ? 'el oculto' : `los ${build.ocultos.size} ocultos`}</button>`,
    );
  partes.lista.innerHTML = items.map(item => fila(build, item, resaltado)).join('');
}
