import type { Build } from '../tipos';
import { escapar, numero } from './dom';
import { icono } from './iconos';

export function pintarBiblioteca(lista: HTMLElement, builds: Build[], actual: string | null) {
  lista.innerHTML = builds
    .map(
      b => `<li aria-current="${b.id === actual}">
        <button class="elegir" data-id="${b.id}">
          <b>${escapar(b.nombre)}</b>
          <small>${b.ejemplo ? 'Ejemplo, ' : ''}${b.tam[1]} capas · ${numero(b.bloques)} bloques</small>
        </button>
        ${b.ejemplo ? '' : `<button class="boton-icono" data-quitar="${b.id}" aria-label="Quitar ${escapar(b.nombre)}">${icono('borrar')}</button>`}
      </li>`,
    )
    .join('');
}
