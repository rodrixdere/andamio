import type { BuildAbierto } from '../modelo';
import type { Cara, Estado } from '../tipos';
import { FINOS } from '../bloques/piezas';
import { textura } from '../texturas';
import { token } from '../ui/dom';

export type Lado = 'sur' | 'este' | 'norte' | 'oeste';

const FLECHA: Record<string, [number, number]> = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };

/** Vistas en 2D: una capa desde arriba (norte arriba) o la fachada desde uno de los cuatro lados. */
export class Plano {
  private g: CanvasRenderingContext2D;
  /** Lado de cada celda en píxeles de pantalla. */
  celda = 10;
  zoom = 1;

  constructor(
    private lienzo: HTMLCanvasElement,
    private contenedor: HTMLElement,
  ) {
    this.g = lienzo.getContext('2d')!;
  }

  private preparar(columnas: number, filas: number) {
    // En pantallas angostas el lienzo toma la proporción del plano, así no queda un hueco arriba y abajo
    this.contenedor.style.height = matchMedia('(width <= 1024px)').matches
      ? `${Math.min(innerHeight * 0.62, ((this.contenedor.clientWidth - 32) * filas) / columnas + 32)}px`
      : '';
    // Entra entero en el lienzo, a lo ancho y a lo alto; el zoom lo agranda y el lienzo pasa a tener scroll
    const ancho = this.contenedor.clientWidth - 32;
    const alto = this.contenedor.clientHeight - 32;
    this.celda = Math.max(5, Math.floor(Math.min(ancho / columnas, alto / filas, 28)) * this.zoom);
    const escala = window.devicePixelRatio || 1;
    this.lienzo.width = columnas * this.celda * escala;
    this.lienzo.height = filas * this.celda * escala;
    this.lienzo.style.width = `${columnas * this.celda}px`;
    this.lienzo.style.height = `${filas * this.celda}px`;
    this.g.setTransform(escala, 0, 0, escala, 0, 0);
    this.g.imageSmoothingEnabled = false;
    this.cuadricula(columnas, filas);
  }

  // Papel milimetrado con una línea más marcada cada 5 bloques, para poder contar
  private cuadricula(columnas: number, filas: number) {
    const { g, celda } = this;
    g.fillStyle = token('--lienzo');
    g.fillRect(0, 0, columnas * celda, filas * celda);
    g.lineWidth = 1;
    for (let i = 0; i <= Math.max(columnas, filas); i++) {
      g.strokeStyle = i % 5 ? token('--reja') : token('--reja-fuerte');
      if (i <= columnas) {
        g.beginPath();
        g.moveTo(i * celda + 0.5, 0);
        g.lineTo(i * celda + 0.5, filas * celda);
        g.stroke();
      }
      if (i <= filas) {
        g.beginPath();
        g.moveTo(0, i * celda + 0.5);
        g.lineTo(columnas * celda, i * celda + 0.5);
        g.stroke();
      }
    }
  }

  private flecha(x: number, y: number, hacia: string) {
    const v = FLECHA[hacia];
    if (!v || this.celda < 9) return;
    const { g, celda } = this;
    const cx = x + celda / 2;
    const cy = y + celda / 2;
    const l = celda * 0.3;
    g.fillStyle = 'rgba(255,255,255,.9)';
    g.strokeStyle = 'rgba(0,0,0,.55)';
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(cx + v[0] * l, cy + v[1] * l);
    g.lineTo(cx - v[0] * l * 0.6 - v[1] * l * 0.6, cy - v[1] * l * 0.6 + v[0] * l * 0.6);
    g.lineTo(cx - v[0] * l * 0.6 + v[1] * l * 0.6, cy - v[1] * l * 0.6 - v[0] * l * 0.6);
    g.closePath();
    g.fill();
    g.stroke();
  }

  private bloque(x: number, y: number, e: Estado, opacidad: number, cara: Cara) {
    const { g, celda } = this;
    const p = e.props;
    g.globalAlpha = opacidad;
    const escala = FINOS.test(e.base) ? 0.55 : 1;
    const margen = ((1 - escala) * celda) / 2;
    g.drawImage(textura(e, cara), x + margen + 1, y + margen + 1, celda * escala - 1, celda * escala - 1);
    if (cara === 'arriba') {
      // Franja clara arriba: va en la mitad de arriba. Franja oscura abajo: en la de abajo.
      if (p.half === 'top' || p.type === 'top') {
        g.fillStyle = 'rgba(255,255,255,.4)';
        g.fillRect(x + 1, y + 1, celda - 1, Math.max(2, celda * 0.2));
      }
      if (p.half === 'bottom' || p.type === 'bottom') {
        g.fillStyle = 'rgba(0,0,0,.32)';
        g.fillRect(x + 1, y + celda * 0.8, celda - 1, celda * 0.2);
      }
      if (p.facing && opacidad > 0.5) this.flecha(x, y, p.facing);
    }
    g.globalAlpha = 1;
  }

  capa(
    build: BuildAbierto,
    y: number,
    opciones: { fantasma: boolean; resaltar: string | null; marcada: [number, number] | null },
  ) {
    const { ancho, fondo } = build;
    this.preparar(ancho, fondo);
    const { celda } = this;

    if (opciones.fantasma && y > 0) {
      for (let z = 0; z < fondo; z++)
        for (let x = 0; x < ancho; x++) {
          const i = build.celda(x, y - 1, z);
          if (i) this.bloque(x * celda, z * celda, build.estado(i), 0.18, 'arriba');
        }
    }
    for (let z = 0; z < fondo; z++)
      for (let x = 0; x < ancho; x++) {
        const i = build.celda(x, y, z);
        if (!i) continue;
        const apagado = opciones.resaltar !== null && !build.items[i - 1].some(([k]) => k === opciones.resaltar);
        this.bloque(x * celda, z * celda, build.estado(i), apagado ? 0.15 : 1, 'arriba');
      }

    if (opciones.marcada) {
      const [x, z] = opciones.marcada;
      this.g.strokeStyle = token('--acento');
      this.g.lineWidth = 2.5;
      this.g.strokeRect(x * celda + 1, z * celda + 1, celda - 2, celda - 2);
    }
    this.g.fillStyle = token('--acento');
    this.g.font = `600 ${Math.max(11, celda * 0.9)}px ${token('--fuente')}`;
    this.g.textAlign = 'right';
    this.g.fillText('N ↑', ancho * celda - 4, Math.max(13, celda));
  }

  /** Lo primero que se ve desde ese lado en cada columna, con lo de más atrás un poco más oscuro. */
  lado(build: BuildAbierto, hastaCapa: number, desde: Lado) {
    const { ancho, alto, fondo } = build;
    // Para cada columna de la imagen: cómo pasar a (x, z) recorriendo de adelante hacia atrás
    const recorrido = {
      sur: { columnas: ancho, profundidad: fondo, posicion: (c: number, d: number) => [c, fondo - 1 - d] },
      norte: { columnas: ancho, profundidad: fondo, posicion: (c: number, d: number) => [ancho - 1 - c, d] },
      este: { columnas: fondo, profundidad: ancho, posicion: (c: number, d: number) => [ancho - 1 - d, fondo - 1 - c] },
      oeste: { columnas: fondo, profundidad: ancho, posicion: (c: number, d: number) => [d, c] },
    }[desde];

    this.preparar(recorrido.columnas, alto);
    const { g, celda } = this;
    for (let y = 0; y < alto; y++)
      for (let c = 0; c < recorrido.columnas; c++)
        for (let d = 0; d < recorrido.profundidad; d++) {
          const [x, z] = recorrido.posicion(c, d);
          const i = build.celda(x, y, z);
          if (!i) continue;
          const px = c * celda;
          const py = (alto - 1 - y) * celda;
          this.bloque(px, py, build.estado(i), y > hastaCapa ? 0.06 : 1, 'lado');
          if (y <= hastaCapa && d > 0) {
            g.fillStyle = `rgba(0,0,0,${Math.min(0.55, d * 0.035)})`;
            g.fillRect(px + 1, py + 1, celda - 1, celda - 1);
          }
          break;
        }
    g.strokeStyle = token('--acento');
    g.lineWidth = 2;
    g.strokeRect(1, (alto - 1 - hastaCapa) * celda + 1, recorrido.columnas * celda - 2, celda - 2);
  }

  /** Celda de la capa que está bajo el punto tocado, o null si cae afuera. */
  celdaEn(build: BuildAbierto, clienteX: number, clienteY: number): [number, number] | null {
    const r = this.lienzo.getBoundingClientRect();
    const x = Math.floor((clienteX - r.left) / this.celda);
    const z = Math.floor((clienteY - r.top) / this.celda);
    return x >= 0 && z >= 0 && x < build.ancho && z < build.fondo ? [x, z] : null;
  }
}
