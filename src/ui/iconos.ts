// Íconos de Phosphor (MIT), versión regular. Vite los trae como texto para insertarlos en línea
// y que tomen el color del texto que los rodea.
import mas from '@phosphor-icons/core/assets/regular/plus.svg?raw';
import ajustes from '@phosphor-icons/core/assets/regular/gear-six.svg?raw';
import abajo from '@phosphor-icons/core/assets/regular/caret-down.svg?raw';
import anterior from '@phosphor-icons/core/assets/regular/caret-left.svg?raw';
import siguiente from '@phosphor-icons/core/assets/regular/caret-right.svg?raw';
import tilde from '@phosphor-icons/core/assets/regular/check.svg?raw';
import terminada from '@phosphor-icons/core/assets/regular/check-circle.svg?raw';
import cerrar from '@phosphor-icons/core/assets/regular/x.svg?raw';
import borrar from '@phosphor-icons/core/assets/regular/trash.svg?raw';
import ojo from '@phosphor-icons/core/assets/regular/eye.svg?raw';
import ojoCerrado from '@phosphor-icons/core/assets/regular/eye-slash.svg?raw';
import etiqueta from '@phosphor-icons/core/assets/regular/tag.svg?raw';
import acercar from '@phosphor-icons/core/assets/regular/magnifying-glass-plus.svg?raw';
import alejar from '@phosphor-icons/core/assets/regular/magnifying-glass-minus.svg?raw';
import arriba from '@phosphor-icons/core/assets/regular/squares-four.svg?raw';
import lado from '@phosphor-icons/core/assets/regular/wall.svg?raw';
import cubo from '@phosphor-icons/core/assets/regular/cube.svg?raw';
import centrar from '@phosphor-icons/core/assets/regular/crosshair.svg?raw';
import capas from '@phosphor-icons/core/assets/regular/stack.svg?raw';
import subir from '@phosphor-icons/core/assets/regular/file-arrow-up.svg?raw';
import pincel from '@phosphor-icons/core/assets/regular/paint-brush.svg?raw';
import imagen from '@phosphor-icons/core/assets/regular/image-square.svg?raw';
import aviso from '@phosphor-icons/core/assets/regular/warning-circle.svg?raw';

const ICONOS = {
  mas,
  ajustes,
  abajo,
  anterior,
  siguiente,
  tilde,
  terminada,
  cerrar,
  borrar,
  ojo,
  ojoCerrado,
  etiqueta,
  acercar,
  alejar,
  arriba,
  lado,
  cubo,
  centrar,
  capas,
  subir,
  pincel,
  imagen,
  aviso,
};

export type Icono = keyof typeof ICONOS;

export const icono = (nombre: Icono) => ICONOS[nombre].replace('<svg ', '<svg aria-hidden="true" focusable="false" ');

/** Reemplaza cada `<i data-icono="...">` del HTML por su SVG. */
export function ponerIconos(raiz: ParentNode = document) {
  raiz.querySelectorAll<HTMLElement>('i[data-icono]').forEach(el => {
    el.outerHTML = icono(el.dataset.icono as Icono);
  });
}
