import type { Estado } from '../tipos';

const DIRECCION: Record<string, string> = {
  north: 'norte',
  south: 'sur',
  east: 'este',
  west: 'oeste',
  up: 'arriba',
  down: 'abajo',
};

/** Cómo va puesto el bloque, en palabras de quien lo está colocando. */
export function describir({ base, props: p }: Estado): string {
  const partes: string[] = [];
  if (p.facing) partes.push((base.endsWith('_stairs') ? 'subiendo hacia el ' : 'mirando al ') + DIRECCION[p.facing]);
  if (p.half === 'top' || p.type === 'top') partes.push('en la mitad de arriba');
  if (p.half === 'bottom' || p.type === 'bottom') partes.push('en la mitad de abajo');
  if (p.type === 'double') partes.push('losa doble');
  if (p.half === 'upper') partes.push('parte de arriba');
  if (p.half === 'lower') partes.push('parte de abajo');
  if (p.part) partes.push(p.part === 'head' ? 'cabecera' : 'pies');
  if (p.open === 'true') partes.push('abierta');
  if (p.hinge) partes.push('bisagra a la ' + (p.hinge === 'left' ? 'izquierda' : 'derecha'));
  if (p.axis) partes.push(p.axis === 'y' ? 'parado' : 'acostado en el eje ' + p.axis);
  if (p.shape && p.shape !== 'straight' && base.endsWith('_stairs')) {
    partes.push('esquina ' + (p.shape.startsWith('inner') ? 'interior' : 'exterior'));
  }
  if (p.hanging === 'true') partes.push('colgando');
  if (p.waterlogged === 'true') partes.push('con agua');
  return partes.join(', ');
}
