import * as THREE from 'three';
import type { BuildAbierto } from '../modelo';
import { piezas } from '../bloques/piezas';
import { textura } from '../texturas';

/**
 * Vista 3D. Hay una malla con instancias por textura y las piezas van ordenadas por capa,
 * así mostrar el build hasta cierta capa es solo cambiar cuántas instancias se dibujan.
 */
export class Vista3D {
  private render: THREE.WebGLRenderer;
  private escena = new THREE.Scene();
  private camara = new THREE.PerspectiveCamera(40, 1, 0.5, 1000);
  // `celdas` guarda, por instancia, en qué lugar del build está, para saber qué bloque se apunta
  // `originales` son las matrices sin ocultar nada, para volver a mostrar sin rearmar
  private mallas: {
    malla: THREE.InstancedMesh;
    finDeCapa: number[];
    celdas: Int32Array;
    originales: Float32Array;
  }[] = [];
  private grupo = new THREE.Group();
  private lamina: THREE.Mesh;
  private orbita = { giro: 0.8, inclinacion: 1, distancia: 60 };
  /** Cuánto se movió la cámara con el teclado, sumado al centro del build. */
  private foco = new THREE.Vector3();
  private teclas = new Set<string>();
  private ultimoCuadro = 0;
  private rayo = new THREE.Raycaster();
  private build: BuildAbierto | null = null;
  private capa = 0;

  constructor(private contenedor: HTMLElement) {
    this.render = new THREE.WebGLRenderer({ antialias: (window.devicePixelRatio || 1) < 2 });
    this.render.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    contenedor.prepend(this.render.domElement);

    this.escena.add(new THREE.HemisphereLight(0xffffff, 0x777766, 2.6));
    const sol = new THREE.DirectionalLight(0xffffff, 1.4);
    sol.position.set(0.6, 1, 0.35);
    this.escena.add(sol, this.grupo);

    // Lámina translúcida sobre la capa que se está construyendo
    this.lamina = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({
        color: 0xf25a24,
        transparent: true,
        opacity: 0.07,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    this.lamina.rotation.x = -Math.PI / 2;
    this.escena.add(this.lamina);

    this.controles();
    // El lugar del 3D cambia con la ventana, con el panel de materiales o al rotar el teléfono
    new ResizeObserver(() => this.ajustarTamano()).observe(contenedor);
  }

  armar(build: BuildAbierto) {
    this.limpiar();
    this.build = build;
    const { ancho, alto, fondo } = build;
    const porTextura = new Map<HTMLCanvasElement, [number[], number, number][]>();

    for (let y = 0; y < alto; y++)
      for (let z = 0; z < fondo; z++)
        for (let x = 0; x < ancho; x++) {
          // Se arma todo, también lo oculto; ocultar después es solo apagar instancias
          const lugar = (y * fondo + z) * ancho + x;
          const i = build.datos.celdas[lugar];
          if (!i) continue;
          const estado = build.estado(i);
          const tex = textura(estado, 'lado');
          const lista = porTextura.get(tex) ?? [];
          for (const [px, py, pz, w, h, d] of piezas(estado))
            lista.push([[x - ancho / 2 + px, y + py, z - fondo / 2 + pz, w, h, d], y, lugar]);
          porTextura.set(tex, lista);
        }

    const cubo = new THREE.BoxGeometry(1, 1, 1);
    const m = new THREE.Matrix4();
    for (const [lienzo, lista] of porTextura) {
      const mapa = new THREE.CanvasTexture(lienzo);
      mapa.magFilter = mapa.minFilter = THREE.NearestFilter;
      mapa.colorSpace = THREE.SRGBColorSpace;
      const transparente = tieneTransparencia(lienzo);
      const material = new THREE.MeshLambertMaterial({
        map: mapa,
        transparent: transparente,
        alphaTest: transparente ? 0.05 : 0,
      });
      const malla = new THREE.InstancedMesh(cubo, material, lista.length);
      const finDeCapa = new Array<number>(alto).fill(0);
      const celdas = new Int32Array(lista.length);
      lista.forEach(([[x, y, z, w, h, d], capa, lugar], n) => {
        m.makeScale(w, h, d);
        m.setPosition(x + w / 2, y + h / 2, z + d / 2);
        malla.setMatrixAt(n, m);
        finDeCapa[capa] = n + 1;
        celdas[n] = lugar;
      });
      for (let y = 1; y < alto; y++) finDeCapa[y] = Math.max(finDeCapa[y], finDeCapa[y - 1]);
      // Con todas las instancias, así la esfera sirve para cualquier capa que se muestre
      malla.computeBoundingSphere();
      this.mallas.push({ malla, finDeCapa, celdas, originales: (malla.instanceMatrix.array as Float32Array).slice() });
      this.grupo.add(malla);
    }
    this.lamina.scale.set(ancho + 2, fondo + 2, 1);
    this.aplicarOcultos();
    this.centrar();
  }

  /** Apaga las instancias de los ítems ocultos (matriz en cero) y prende el resto. */
  aplicarOcultos() {
    const b = this.build;
    if (!b) return;
    for (const { malla, celdas, originales } of this.mallas) {
      const matrices = malla.instanceMatrix.array as Float32Array;
      for (let n = 0; n < celdas.length; n++) {
        if (b.visible(celdas[n])) matrices.set(originales.subarray(n * 16, n * 16 + 16), n * 16);
        else matrices.fill(0, n * 16, n * 16 + 16);
      }
      malla.instanceMatrix.needsUpdate = true;
    }
    this.dibujar();
  }

  private limpiar() {
    for (const { malla } of this.mallas) {
      const material = malla.material as THREE.MeshLambertMaterial;
      material.map?.dispose();
      material.dispose();
      malla.dispose();
    }
    this.grupo.clear();
    this.mallas = [];
  }

  mostrar(capa: number, todo: boolean, fondoColor: string) {
    if (!this.build) return;
    this.capa = capa;
    const hasta = todo ? this.build.alto - 1 : capa;
    for (const { malla, finDeCapa } of this.mallas) malla.count = finDeCapa[hasta];
    this.lamina.visible = !todo;
    this.lamina.position.y = capa + 1.02;
    this.render.setClearColor(new THREE.Color(fondoColor));
    this.dibujar();
  }

  centrar() {
    if (!this.build) return;
    this.foco.set(0, 0, 0);
    this.orbita = {
      giro: 0.8,
      inclinacion: 1,
      distancia: Math.max(this.build.ancho, this.build.fondo, this.build.alto) * 1.9,
    };
    this.dibujar();
  }

  ajustarTamano() {
    const { clientWidth: w, clientHeight: h } = this.contenedor;
    if (!w || !h) return;
    this.render.setSize(w, h, false);
    this.camara.aspect = w / h;
    this.camara.updateProjectionMatrix();
    this.dibujar();
  }

  private dibujar() {
    if (!this.build) return;
    const { giro, inclinacion, distancia } = this.orbita;
    const { x, y, z } = this.foco;
    const centro = y + Math.min(this.build.alto, this.capa + 1) / 2;
    this.camara.position.set(
      x + distancia * Math.sin(inclinacion) * Math.cos(giro),
      centro + distancia * Math.cos(inclinacion),
      z + distancia * Math.sin(inclinacion) * Math.sin(giro),
    );
    this.camara.lookAt(x, centro, z);
    this.render.render(this.escena, this.camara);
  }

  /** Lugar en el build (índice en `celdas`) del bloque bajo ese punto de la pantalla, o -1. */
  lugarEn(clienteX: number, clienteY: number): number {
    const r = this.render.domElement.getBoundingClientRect();
    const punto = new THREE.Vector2(((clienteX - r.left) / r.width) * 2 - 1, -((clienteY - r.top) / r.height) * 2 + 1);
    this.rayo.setFromCamera(punto, this.camara);
    const golpe = this.rayo.intersectObjects(this.grupo.children, false)[0];
    if (golpe?.instanceId === undefined) return -1;
    return this.mallas.find(x => x.malla === golpe.object)?.celdas[golpe.instanceId] ?? -1;
  }

  /**
   * WASD mueve sobre el piso, Espacio y Shift suben y bajan, Q y E giran.
   * Devuelve false si la tecla no es de la cámara.
   */
  tecla(codigo: string, apretada: boolean): boolean {
    if (!MOVIMIENTOS.has(codigo)) return false;
    if (!apretada) this.teclas.delete(codigo);
    else if (!this.teclas.has(codigo)) {
      this.teclas.add(codigo);
      if (this.teclas.size === 1) {
        this.ultimoCuadro = performance.now();
        requestAnimationFrame(t => this.volar(t));
      }
    }
    return true;
  }

  soltarTeclas() {
    this.teclas.clear();
  }

  private volar(ahora: number) {
    if (!this.teclas.size || !this.build) return;
    // Por segundo: media vuelta de giro y más o menos el ancho del build de avance
    const dt = Math.min(0.1, (ahora - this.ultimoCuadro) / 1000);
    this.ultimoCuadro = ahora;
    const paso = Math.max(8, Math.max(this.build.ancho, this.build.fondo) * 0.8) * dt;
    const t = (c: string) => (this.teclas.has(c) ? 1 : 0);
    const adelante = t('KeyW') - t('KeyS');
    const derecha = t('KeyD') - t('KeyA');
    const { giro } = this.orbita;
    this.foco.x += (-Math.cos(giro) * adelante + Math.sin(giro) * derecha) * paso;
    this.foco.z += (-Math.sin(giro) * adelante - Math.cos(giro) * derecha) * paso;
    this.foco.y += (t('Space') - t('ShiftLeft') - t('ShiftRight')) * paso;
    this.orbita.giro += (t('KeyE') - t('KeyQ')) * Math.PI * 0.5 * dt;
    this.dibujar();
    requestAnimationFrame(t2 => this.volar(t2));
  }

  // Arrastrar gira, pellizcar o la rueda acercan. Sin OrbitControls para no sumar otra dependencia.
  private controles() {
    const el = this.render.domElement;
    const punteros = new Map<number, [number, number]>();
    let separacionPrevia = 0;
    const limitar = (d: number) => {
      const lado = this.build ? Math.max(this.build.ancho, this.build.fondo, this.build.alto) : 50;
      return Math.min(lado * 6, Math.max(6, d));
    };
    const soltar = (e: PointerEvent) => {
      punteros.delete(e.pointerId);
      separacionPrevia = 0;
    };

    el.addEventListener('pointerdown', e => {
      el.setPointerCapture(e.pointerId);
      punteros.set(e.pointerId, [e.clientX, e.clientY]);
    });
    el.addEventListener('pointerup', soltar);
    el.addEventListener('pointercancel', soltar);
    el.addEventListener('pointermove', e => {
      const previo = punteros.get(e.pointerId);
      if (!previo) return;
      punteros.set(e.pointerId, [e.clientX, e.clientY]);
      if (punteros.size === 2) {
        const [a, b] = [...punteros.values()];
        const separacion = Math.hypot(a[0] - b[0], a[1] - b[1]);
        if (separacionPrevia) this.orbita.distancia = limitar((this.orbita.distancia * separacionPrevia) / separacion);
        separacionPrevia = separacion;
      } else {
        this.orbita.giro += (e.clientX - previo[0]) * 0.008;
        this.orbita.inclinacion = Math.min(
          Math.PI / 2 - 0.02,
          Math.max(0.15, this.orbita.inclinacion - (e.clientY - previo[1]) * 0.008),
        );
      }
      this.dibujar();
    });
    el.addEventListener(
      'wheel',
      e => {
        e.preventDefault();
        this.orbita.distancia = limitar(this.orbita.distancia * (1 + Math.sign(e.deltaY) * 0.1));
        this.dibujar();
      },
      { passive: false },
    );
  }
}

const MOVIMIENTOS = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE', 'Space', 'ShiftLeft', 'ShiftRight']);

function tieneTransparencia(lienzo: HTMLCanvasElement): boolean {
  const datos = lienzo.getContext('2d')!.getImageData(0, 0, lienzo.width, lienzo.height).data;
  for (let i = 3; i < datos.length; i += 4) if (datos[i] < 250) return true;
  return false;
}
