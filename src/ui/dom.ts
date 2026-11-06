export function $<T extends HTMLElement = HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Falta el elemento #${id} en index.html`);
  return el as T;
}

export const escapar = (s: string) =>
  s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export const token = (nombre: string) => getComputedStyle(document.documentElement).getPropertyValue(nombre).trim();

export const numero = (n: number) => n.toLocaleString('es');
