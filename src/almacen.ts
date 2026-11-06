import type { Build } from './tipos';
import type { Paquete } from './texturas/juego';

// Todo queda en el navegador de la persona. Si el navegador no deja guardar (modo privado, almacenamiento
// bloqueado), la página sigue funcionando y solo se pierde lo guardado al cerrar.

const BASE = 'planos-de-bloques';
const PREFIJO = 'pb-';

const abrir = (): Promise<IDBDatabase | null> =>
  new Promise(listo => {
    try {
      const pedido = indexedDB.open(BASE, 1);
      pedido.onupgradeneeded = () => {
        pedido.result.createObjectStore('builds', { keyPath: 'id' });
        pedido.result.createObjectStore('texturas');
      };
      pedido.onsuccess = () => listo(pedido.result);
      pedido.onerror = () => listo(null);
    } catch {
      listo(null);
    }
  });

let base: Promise<IDBDatabase | null> | null = null;

async function operar<T>(
  tienda: string,
  modo: IDBTransactionMode,
  accion: (t: IDBObjectStore) => IDBRequest<T> | void,
) {
  base ??= abrir();
  const db = await base;
  if (!db) return undefined;
  return new Promise<T | undefined>(listo => {
    try {
      const tx = db.transaction(tienda, modo);
      const pedido = accion(tx.objectStore(tienda));
      tx.oncomplete = () => listo(pedido ? pedido.result : undefined);
      tx.onerror = () => listo(undefined);
    } catch {
      listo(undefined);
    }
  });
}

export const builds = {
  todos: async () => (await operar<Build[]>('builds', 'readonly', t => t.getAll())) ?? [],
  /** Devuelve false si el navegador no dejó guardar. */
  guardar: async (b: Build) => (await operar('builds', 'readwrite', t => t.put(b))) !== undefined,
  borrar: (id: string) => operar('builds', 'readwrite', t => void t.delete(id)),
};

export const paqueteDeTexturas = {
  leer: () => operar<Paquete>('texturas', 'readonly', t => t.get('paquete')),
  guardar: (p: Paquete) => operar('texturas', 'readwrite', t => void t.put(p, 'paquete')),
};

/** Preferencias chicas de esta persona: capa en la que iba, capas terminadas, fuente de texturas. */
export function preferencia<T>(clave: string, siNoHay: T): T {
  try {
    const v = localStorage.getItem(PREFIJO + clave);
    return v == null ? siNoHay : (JSON.parse(v) as T);
  } catch {
    return siNoHay;
  }
}

export function guardarPreferencia(clave: string, valor: unknown) {
  try {
    localStorage.setItem(PREFIJO + clave, JSON.stringify(valor));
  } catch {
    // Sin almacenamiento disponible: la preferencia dura hasta que se cierre la página
  }
}
