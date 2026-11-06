import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import './estilos.css';
import type { Build } from './tipos';
import type { Vista3D } from './vistas/tres';
import { BuildAbierto } from './modelo';
import { leerLitematic } from './litematic/leer';
import { descomprimir, type BuildCompacto } from './litematic/compacto';
import { builds as guardados, guardarPreferencia, paqueteDeTexturas, preferencia } from './almacen';
import { describir } from './bloques/describir';
import { nombreItem } from './bloques/nombres';
import { delJuego, elegirFuente, textura, usandoDelJuego } from './texturas';
import { extraerPaquete } from './texturas/juego';
import { Plano, type Lado } from './vistas/plano';
import { pintarBiblioteca } from './ui/biblioteca';
import { olvidarMuestras, pintarMateriales, type Alcance } from './ui/materiales';
import { icono, ponerIconos } from './ui/iconos';
import { $, escapar, numero, token } from './ui/dom';

type Vista = 'capa' | 'lado' | '3d';

const estado = {
  builds: [] as Build[],
  build: null as BuildAbierto | null,
  capa: 0,
  vista: 'capa' as Vista,
  lado: 'sur' as Lado,
  alcance: 'capa' as Alcance,
  fantasma: true,
  todo3d: false,
  nombres3d: false,
  resaltado: null as string | null,
  marcada: null as [number, number] | null,
};

const plano = new Plano($<HTMLCanvasElement>('plano'), $('lienzo-2d'));
let vista3d: Vista3D | null = null;
let armadoEn3D = '';
let ocultosEn3D = '';

const capasTerminadas = (id: string) => new Set(preferencia<number[]>(`hechas-${id}`, []));
const presionado = (id: string, si: boolean) => $(id).setAttribute('aria-pressed', String(si));

// ---------------------------------------------------------------- dibujo

function dibujar() {
  const b = estado.build;
  if (!b) return;
  if (estado.vista === 'capa') {
    plano.capa(b, estado.capa, { fantasma: estado.fantasma, resaltar: estado.resaltado, marcada: estado.marcada });
  } else if (estado.vista === 'lado') {
    plano.lado(b, estado.capa, estado.lado);
  } else {
    void mostrar3d();
  }
}

async function mostrar3d() {
  const b = estado.build;
  if (!b) return;
  if (!vista3d) {
    try {
      const { Vista3D } = await import('./vistas/tres');
      vista3d = new Vista3D($('lienzo-3d'));
    } catch {
      avisar('No se pudo abrir la vista 3D en este navegador.', true);
      return;
    }
  }
  // Se vuelve a armar solo si cambió el build o la fuente de texturas
  const clave = b.datos.id + (usandoDelJuego() ? ':juego' : ':dibujo');
  const ocultos = [...b.ocultos].join();
  if (armadoEn3D !== clave) {
    vista3d.armar(b);
    armadoEn3D = clave;
  } else if (ocultosEn3D !== ocultos) {
    vista3d.aplicarOcultos();
  }
  ocultosEn3D = ocultos;
  vista3d.ajustarTamano();
  vista3d.mostrar(estado.capa, estado.todo3d, token('--lienzo'));
}

function materiales() {
  if (!estado.build) return;
  pintarMateriales(
    { resumen: $('mat-resumen'), lista: $('mat-lista') },
    estado.build,
    estado.capa,
    estado.alcance,
    estado.resaltado,
  );
}

function biblioteca() {
  pintarBiblioteca($('lista-builds'), estado.builds, estado.build?.datos.id ?? null);
}

function repintarTodo() {
  olvidarMuestras();
  materiales();
  dibujar();
}

// ---------------------------------------------------------------- capas y vistas

function irACapa(y: number) {
  const b = estado.build;
  if (!b) return;
  const anterior = estado.capa;
  estado.capa = Math.max(0, Math.min(b.alto - 1, y));
  estado.marcada = null;
  guardarPreferencia(`capa-${b.datos.id}`, estado.capa);

  const rango = $<HTMLInputElement>('capa-rango');
  rango.value = String(estado.capa + 1);
  rango.style.setProperty('--progreso', `${b.alto > 1 ? (estado.capa / (b.alto - 1)) * 100 : 100}%`);
  rango.setAttribute('aria-valuetext', `Capa ${estado.capa + 1} de ${b.alto}`);

  $('capa-numero').textContent = String(estado.capa + 1);
  $('capa-total').textContent = `de ${b.alto}`;
  if (anterior !== estado.capa) {
    // Reinicia la animación del número aunque se cambie de capa muy seguido
    const grande = document.querySelector('.capa-grande')!;
    grande.classList.remove('cambia');
    void (grande as HTMLElement).offsetWidth;
    grande.classList.add('cambia');
  }

  presionado('terminar', capasTerminadas(b.datos.id).has(estado.capa));
  $<HTMLButtonElement>('bajar').disabled = estado.capa === 0;
  $<HTMLButtonElement>('subir').disabled = estado.capa === b.alto - 1;
  $('ficha-bloque').hidden = true;
  materiales();
  dibujar();
}

function elegirVista(v: Vista) {
  estado.vista = v;
  document
    .querySelectorAll<HTMLButtonElement>('[data-vista]')
    .forEach(b => b.setAttribute('aria-selected', String(b.dataset.vista === v)));
  document.querySelectorAll<HTMLElement>('[data-para]').forEach(h => (h.hidden = h.dataset.para !== v));
  $('lienzo-2d').hidden = v === '3d';
  $('lienzo-3d').hidden = v !== '3d';
  if (v !== 'capa') $('ficha-bloque').hidden = true;
  if (v !== '3d') {
    vista3d?.soltarTeclas();
    $('etiqueta-3d').hidden = true;
  }
  dibujar();
}

function mostrarBloque(x: number, z: number) {
  const b = estado.build!;
  const i = b.celda(x, estado.capa, z);
  const ficha = $('ficha-bloque');
  estado.marcada = i ? [x, z] : null;
  if (!i) {
    ficha.hidden = true;
  } else {
    const e = b.estado(i);
    const item = b.clave(i);
    const detalle = describir(e);
    ficha.innerHTML = `<span class="muestra" style="background-image:url(${textura(e, 'arriba').toDataURL()})"></span>
      <span><b>${escapar(nombreItem(item))}</b>
      <small>${detalle ? escapar(detalle) + '. ' : ''}Columna ${x + 1}, fila ${z + 1}</small></span>
      <button class="boton-icono" data-cerrar-ficha aria-label="Cerrar">${icono('cerrar')}</button>`;
    ficha.hidden = false;
  }
  dibujar();
}

function ocultar(clave: string | null) {
  const b = estado.build!;
  const ocultos = new Set(clave ? b.ocultos : []);
  if (clave && !ocultos.delete(clave)) ocultos.add(clave);
  b.ocultar(ocultos);
  guardarPreferencia(`ocultos-${b.datos.id}`, [...ocultos]);
  $('ficha-bloque').hidden = true;
  estado.marcada = null;
  materiales();
  dibujar();
}

// ---------------------------------------------------------------- 3D: nombres al apuntar

function nombres3d(si: boolean) {
  estado.nombres3d = si;
  presionado('nombres3d', si);
  if (!si) $('etiqueta-3d').hidden = true;
}

let apuntado: PointerEvent | null = null;
function etiquetar() {
  const e = apuntado;
  apuntado = null;
  const b = estado.build;
  const etiqueta = $('etiqueta-3d');
  const lugar = e && b && vista3d ? vista3d.lugarEn(e.clientX, e.clientY) : -1;
  if (!e || !b || lugar < 0) {
    etiqueta.hidden = true;
    return;
  }
  const capa = Math.floor(lugar / (b.ancho * b.fondo));
  etiqueta.innerHTML = `${escapar(nombreItem(b.clave(b.datos.celdas[lugar])))}<small>Capa ${capa + 1}</small>`;
  const caja = $('lienzo-3d').getBoundingClientRect();
  etiqueta.style.transform = `translate(${e.clientX - caja.left + 14}px, ${e.clientY - caja.top + 14}px)`;
  etiqueta.hidden = false;
}

// ---------------------------------------------------------------- builds

function abrir(b: Build) {
  const abierto = new BuildAbierto(b);
  abierto.ocultar(preferencia<string[]>(`ocultos-${b.id}`, []));
  estado.build = abierto;
  estado.resaltado = null;
  guardarPreferencia('elegido', b.id);

  $('vacio').hidden = true;
  $('app').hidden = false;
  $('capas').hidden = false;
  $('abrir-builds').hidden = false;
  $('nombre-build').textContent = b.nombre;
  document.title = `${b.nombre} · Andamio`;
  $('build-datos').textContent = [
    b.autor && `de ${b.autor}`,
    `${abierto.ancho} × ${abierto.fondo}`,
    `${numero(b.bloques)} bloques`,
  ]
    .filter(Boolean)
    .join(', ');

  const rango = $<HTMLInputElement>('capa-rango');
  rango.max = String(abierto.alto);
  vista3d?.centrar();
  olvidarMuestras();
  biblioteca();
  irACapa(preferencia(`capa-${b.id}`, 0));
}

// ---------------------------------------------------------------- bienvenida

let ejemploPrevia: BuildAbierto | null = null;
let pasoPrevia = 0;

// Recorre el ejemplo capa por capa, que es justo lo que hace la app; quieto si se pide menos movimiento
function animarPrevia() {
  clearInterval(pasoPrevia);
  const b = ejemploPrevia;
  $('previa').hidden = !b;
  if (!b) return;
  const plano = new Plano($<HTMLCanvasElement>('previa-plano'), $('previa-lienzo'));
  $('previa-nombre').textContent = b.datos.nombre;
  let capa = 0;
  const pintar = () => {
    plano.capa(b, capa, { fantasma: true, resaltar: null, marcada: null });
    $('previa-capa').textContent = `Capa ${capa + 1} de ${b.alto}`;
  };
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    capa = Math.floor(b.alto / 3);
    pintar();
    return;
  }
  pintar();
  pasoPrevia = window.setInterval(() => {
    if ($('vacio').hidden) return clearInterval(pasoPrevia);
    capa = (capa + 1) % b.alto;
    pintar();
  }, 650);
}

function sinBuilds() {
  estado.build = null;
  biblioteca();
  $('app').hidden = true;
  $('capas').hidden = true;
  $('abrir-builds').hidden = true;
  $('vacio').hidden = false;
  document.title = 'Andamio';
  animarPrevia();
}

function elegir(id: string | undefined) {
  const b = estado.builds.find(x => x.id === id) ?? estado.builds[0];
  if (b) abrir(b);
  else sinBuilds();
}

let ocultarAviso = 0;
function avisar(texto: string, error = false) {
  const el = $('aviso');
  clearTimeout(ocultarAviso);
  el.hidden = !texto;
  el.textContent = texto;
  el.classList.toggle('error', error);
  // Los avisos de progreso se van solos; los errores quedan hasta la próxima acción
  if (texto && !error) ocultarAviso = window.setTimeout(() => (el.hidden = true), 4000);
}

const huella = (b: Build) => [b.nombre, b.autor, ...b.tam, b.bloques, b.paleta.length].join('|');

async function agregar(archivos: File[]) {
  const validos = archivos.filter(f => /\.litematic$/i.test(f.name));
  if (!validos.length) {
    avisar(
      'Solo puedo leer archivos .litematic. Un .schem o .nbt se puede exportar como .litematic desde Litematica.',
      true,
    );
    return;
  }
  const fallas: string[] = [];
  let ultimo: Build | null = null;
  let sinGuardar = false;
  for (const f of validos) {
    avisar(`Leyendo ${f.name}…`);
    try {
      const b = await leerLitematic(await f.arrayBuffer(), f.name);
      // El mismo build subido otra vez abre el que ya estaba en vez de duplicarlo
      const repetido = estado.builds.find(x => !x.ejemplo && huella(x) === huella(b));
      if (repetido) {
        ultimo = repetido;
        continue;
      }
      if (!(await guardados.guardar(b))) sinGuardar = true;
      estado.builds.push(b);
      ultimo = b;
    } catch (err) {
      fallas.push(`${f.name}: ${(err as Error).message}`);
    }
  }
  if (fallas.length) avisar('No pude leer ' + fallas.join(' / '), true);
  else if (sinGuardar) avisar('Este navegador no deja guardar: el build se pierde al cerrar la pestaña.', true);
  else avisar('');
  if (ultimo) {
    $<HTMLDialogElement>('dialogo-builds').close();
    abrir(ultimo);
  }
}

async function quitar(id: string) {
  await guardados.borrar(id);
  estado.builds = estado.builds.filter(b => b.id !== id);
  if (estado.build?.datos.id === id) elegir(estado.builds[0]?.id);
  else biblioteca();
  if (!estado.builds.length) $<HTMLDialogElement>('dialogo-builds').close();
}

async function cargarEjemplo(): Promise<Build | null> {
  try {
    const r = await fetch('/ejemplo.json');
    if (!r.ok) return null;
    return { ...descomprimir((await r.json()) as BuildCompacto, 'ejemplo'), ejemplo: true };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------- texturas

function marcarFuente() {
  const juego = usandoDelJuego();
  $('tex-dibujo').setAttribute('aria-checked', String(!juego));
  $('tex-juego').setAttribute('aria-checked', String(juego));
}

function usarFuente(juego: boolean) {
  elegirFuente(juego);
  guardarPreferencia('texturas-del-juego', juego);
  marcarFuente();
  repintarTodo();
}

async function cargarPaquete(archivo: File) {
  const aviso = $('tex-estado');
  aviso.textContent = `Leyendo ${archivo.name}…`;
  try {
    const paquete = await extraerPaquete(archivo);
    await paqueteDeTexturas.guardar(paquete);
    await delJuego.usar(paquete);
    aviso.textContent = `${numero(delJuego.cantidad)} texturas de ${archivo.name}, guardadas en este navegador.`;
    usarFuente(true);
  } catch (err) {
    aviso.textContent = `No pude leer ${archivo.name}: ${(err as Error).message}`;
  }
}

// ---------------------------------------------------------------- eventos

function conectar() {
  const elegirArchivo = () => $('archivo').click();
  for (const id of ['agregar', 'agregar-vacio', 'agregar-hoja']) $(id).addEventListener('click', elegirArchivo);
  $('ver-ejemplo').addEventListener('click', () => elegir('ejemplo'));
  $<HTMLInputElement>('archivo').addEventListener('change', e => {
    const input = e.target as HTMLInputElement;
    void agregar([...(input.files ?? [])]);
    input.value = '';
  });

  // Diálogos: se cierran con su botón, con Escape (nativo) o tocando afuera
  const dialogos = { 'abrir-builds': 'dialogo-builds', 'abrir-ajustes': 'dialogo-ajustes' };
  for (const [boton, id] of Object.entries(dialogos)) {
    const d = $<HTMLDialogElement>(id);
    $(boton).addEventListener('click', () => d.showModal());
    d.addEventListener('click', e => {
      const t = e.target as HTMLElement;
      if (t === d || t.closest('[data-cerrar]')) d.close();
    });
  }

  $('lista-builds').addEventListener('click', e => {
    const t = e.target as HTMLElement;
    const quitarBtn = t.closest<HTMLElement>('[data-quitar]');
    if (quitarBtn) return void quitar(quitarBtn.dataset.quitar!);
    const elegirBtn = t.closest<HTMLElement>('[data-id]');
    if (elegirBtn) {
      elegir(elegirBtn.dataset.id);
      $<HTMLDialogElement>('dialogo-builds').close();
    }
  });

  document
    .querySelectorAll<HTMLButtonElement>('[data-vista]')
    .forEach(b => b.addEventListener('click', () => elegirVista(b.dataset.vista as Vista)));
  $('fantasma').addEventListener('click', () => {
    estado.fantasma = !estado.fantasma;
    presionado('fantasma', estado.fantasma);
    dibujar();
  });
  $('zoom-mas').addEventListener('click', () => {
    plano.zoom = Math.min(4, plano.zoom + 0.5);
    dibujar();
  });
  $('zoom-menos').addEventListener('click', () => {
    plano.zoom = Math.max(1, plano.zoom - 0.5);
    dibujar();
  });
  $('lados').addEventListener('click', e => {
    const boton = (e.target as HTMLElement).closest<HTMLElement>('[data-lado]');
    if (!boton) return;
    estado.lado = boton.dataset.lado as Lado;
    $('lados')
      .querySelectorAll('button')
      .forEach(x => x.setAttribute('aria-pressed', String(x === boton)));
    dibujar();
  });
  $('todo3d').addEventListener('click', () => {
    estado.todo3d = !estado.todo3d;
    presionado('todo3d', estado.todo3d);
    dibujar();
  });
  $('centrar3d').addEventListener('click', () => vista3d?.centrar());
  $('nombres3d').addEventListener('click', () => nombres3d(!estado.nombres3d));
  const lienzo3d = $('lienzo-3d');
  lienzo3d.addEventListener('pointermove', e => {
    // Mientras se arrastra para girar, la etiqueta estorba
    if (!estado.nombres3d || e.buttons) return void ($('etiqueta-3d').hidden = true);
    if (!apuntado) requestAnimationFrame(etiquetar);
    apuntado = e;
  });
  lienzo3d.addEventListener('pointerleave', () => ($('etiqueta-3d').hidden = true));

  $('plano').addEventListener('click', e => {
    const b = estado.build;
    if (!b || estado.vista !== 'capa') return;
    const celda = plano.celdaEn(b, e.clientX, e.clientY);
    if (celda) mostrarBloque(...celda);
  });
  $('ficha-bloque').addEventListener('click', e => {
    if (!(e.target as HTMLElement).closest('[data-cerrar-ficha]')) return;
    $('ficha-bloque').hidden = true;
    estado.marcada = null;
    dibujar();
  });

  $('mat-resumen').addEventListener('click', e => {
    if ((e.target as HTMLElement).closest('[data-mostrar-todos]')) ocultar(null);
  });
  $('mat-lista').addEventListener('click', e => {
    const ojo = (e.target as HTMLElement).closest<HTMLElement>('[data-ocultar]');
    if (ojo) return ocultar(ojo.dataset.ocultar!);
    const boton = (e.target as HTMLElement).closest<HTMLElement>('[data-item]');
    if (!boton) return;
    estado.resaltado = estado.resaltado === boton.dataset.item ? null : boton.dataset.item!;
    if (estado.vista !== 'capa') elegirVista('capa');
    materiales();
    dibujar();
  });
  for (const [id, alcance] of [
    ['mat-capa', 'capa'],
    ['mat-todo', 'todo'],
  ] as const) {
    $(id).addEventListener('click', () => {
      estado.alcance = alcance;
      presionado('mat-capa', alcance === 'capa');
      presionado('mat-todo', alcance === 'todo');
      materiales();
    });
  }

  $('bajar').addEventListener('click', () => irACapa(estado.capa - 1));
  $('subir').addEventListener('click', () => irACapa(estado.capa + 1));
  $('capa-rango').addEventListener('input', e => irACapa(Number((e.target as HTMLInputElement).value) - 1));
  $('terminar').addEventListener('click', () => {
    const b = estado.build;
    if (!b) return;
    const hechas = capasTerminadas(b.datos.id);
    if (hechas.has(estado.capa)) hechas.delete(estado.capa);
    else hechas.add(estado.capa);
    guardarPreferencia(`hechas-${b.datos.id}`, [...hechas]);
    presionado('terminar', hechas.has(estado.capa));
  });
  const teclaLibre = (e: KeyboardEvent) =>
    !e.ctrlKey &&
    !e.metaKey &&
    !e.altKey &&
    !(e.target as Element).matches?.('input') &&
    !document.querySelector('dialog[open]');
  document.addEventListener('keyup', e => {
    if (estado.vista === '3d' && vista3d?.tecla(e.code, false)) e.preventDefault();
  });
  addEventListener('blur', () => vista3d?.soltarTeclas());
  document.addEventListener('keydown', e => {
    const t = e.target as HTMLElement;
    if (estado.vista === '3d' && teclaLibre(e)) {
      if (vista3d?.tecla(e.code, true)) return e.preventDefault();
      if (e.code === 'KeyN' && !e.repeat) return nombres3d(!estado.nombres3d);
      if (e.code === 'KeyR') return vista3d?.centrar();
    }
    if (t.matches?.('input[type="range"]') || document.querySelector('dialog[open]')) return;
    if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault();
      irACapa(estado.capa + 1);
    }
    if (e.key === 'ArrowDown' || e.key === 'PageDown') {
      e.preventDefault();
      irACapa(estado.capa - 1);
    }
  });

  $('tex-dibujo').addEventListener('click', () => usarFuente(false));
  $('tex-juego').addEventListener('click', () => (delJuego.cantidad ? usarFuente(true) : $('paquete').click()));
  $<HTMLInputElement>('paquete').addEventListener('change', e => {
    const input = e.target as HTMLInputElement;
    if (input.files?.[0]) void cargarPaquete(input.files[0]);
    input.value = '';
  });

  // Arrastrar archivos a cualquier parte de la página
  let dentro = 0;
  addEventListener('dragenter', e => {
    if (!e.dataTransfer?.types.includes('Files')) return;
    dentro++;
    document.body.classList.add('arrastrando');
  });
  addEventListener('dragleave', () => {
    if (--dentro > 0) return;
    dentro = 0;
    document.body.classList.remove('arrastrando');
  });
  addEventListener('dragover', e => e.preventDefault());
  addEventListener('drop', e => {
    e.preventDefault();
    dentro = 0;
    document.body.classList.remove('arrastrando');
    const archivos = [...(e.dataTransfer?.files ?? [])];
    const paquete = archivos.find(f => /\.(jar|zip)$/i.test(f.name));
    if (paquete) void cargarPaquete(paquete);
    if (archivos.some(f => /\.litematic$/i.test(f.name))) void agregar(archivos);
  });

  let espera = 0;
  addEventListener('resize', () => {
    clearTimeout(espera);
    espera = window.setTimeout(dibujar, 120);
  });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    armadoEn3D = '';
    dibujar();
  });
}

// ---------------------------------------------------------------- arranque

async function iniciar() {
  ponerIconos();
  conectar();

  const [ejemplo, propios, paquete] = await Promise.all([cargarEjemplo(), guardados.todos(), paqueteDeTexturas.leer()]);
  estado.builds = [...(ejemplo ? [ejemplo] : []), ...propios];

  if (paquete) {
    await delJuego.usar(paquete);
    $('tex-estado').textContent =
      `${numero(delJuego.cantidad)} texturas guardadas en este navegador. Soltá otro archivo para cambiarlas.`;
  }
  elegirFuente(preferencia('texturas-del-juego', false));
  marcarFuente();
  // Alguien nuevo arranca en la bienvenida; el ejemplo se abre solo si lo pide
  const elegido = preferencia<string | undefined>('elegido', undefined);
  $('ver-ejemplo').hidden = !ejemplo;
  ejemploPrevia = ejemplo && new BuildAbierto(ejemplo);
  if (elegido || propios.length) elegir(elegido);
  else sinBuilds();
  elegirVista('capa');
}

void iniciar();
