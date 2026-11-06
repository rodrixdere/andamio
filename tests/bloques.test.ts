import { describe, expect, it } from 'vitest';
import { BuildAbierto } from '../src/modelo';
import type { Build } from '../src/tipos';
import { leerEstado } from '../src/bloques/estado';
import { itemsDe, textoStacks } from '../src/bloques/items';
import { nombreItem } from '../src/bloques/nombres';
import { describir } from '../src/bloques/describir';

const items = (s: string) => itemsDe(leerEstado(s));

describe('leerEstado', () => {
  it('separa el nombre de las propiedades', () => {
    expect(leerEstado('minecraft:oak_stairs[facing=east,half=top]')).toEqual({
      base: 'oak_stairs',
      props: { facing: 'east', half: 'top' },
    });
    expect(leerEstado('minecraft:stone')).toEqual({ base: 'stone', props: {} });
  });
});

describe('itemsDe', () => {
  it('una puerta y una cama cuentan una vez', () => {
    expect(items('minecraft:oak_door[half=lower]')).toEqual([['oak_door', 1]]);
    expect(items('minecraft:oak_door[half=upper]')).toEqual([]);
    expect(items('minecraft:red_bed[part=foot]')).toEqual([['red_bed', 1]]);
    expect(items('minecraft:red_bed[part=head]')).toEqual([]);
  });

  it('una losa doble son dos losas', () => {
    expect(items('minecraft:spruce_slab[type=double]')).toEqual([['spruce_slab', 2]]);
    expect(items('minecraft:spruce_slab[type=top]')).toEqual([['spruce_slab', 1]]);
  });

  it('una maceta con planta lleva las dos cosas', () => {
    expect(items('minecraft:potted_red_tulip')).toEqual([
      ['flower_pot', 1],
      ['red_tulip', 1],
    ]);
  });

  it('cuenta las unidades que guarda un solo bloque', () => {
    expect(items('minecraft:candle[candles=3,lit=false]')).toEqual([['candle', 3]]);
    expect(items('minecraft:turtle_egg[eggs=4,hatch=0]')).toEqual([['turtle_egg', 4]]);
  });

  it('pasa los cultivos y lo colgado en la pared a su ítem', () => {
    expect(items('minecraft:wheat[age=7]')).toEqual([['wheat_seeds', 1]]);
    expect(items('minecraft:red_wall_banner[facing=east]')).toEqual([['red_banner', 1]]);
    expect(items('minecraft:water_cauldron[level=3]')).toEqual([['cauldron', 1]]);
  });
});

describe('textoStacks', () => {
  it('reparte en stacks de 64, o de 16 y 1 según el ítem', () => {
    expect(textoStacks('spruce_planks', 1060)).toBe('16 stacks de 64 + 36');
    expect(textoStacks('spruce_planks', 64)).toBe('1 stack de 64');
    expect(textoStacks('spruce_planks', 10)).toBe('');
    expect(textoStacks('red_banner', 20)).toBe('1 stack de 16 + 4');
    expect(textoStacks('red_bed', 3)).toBe('3 stacks de 1');
  });
});

describe('nombreItem', () => {
  it('usa el nombre del juego en español', () => {
    expect(nombreItem('dark_oak_stairs')).toBe('Escaleras de roble oscuro');
    expect(nombreItem('stripped_birch_log')).toBe('Tronco de abedul sin corteza');
    expect(nombreItem('deepslate_brick_wall')).toBe('Muro de ladrillos de pizarra abismal');
    expect(nombreItem('red_carpet')).toBe('Alfombra roja');
    expect(nombreItem('light_blue_stained_glass_pane')).toBe('Panel de vidrio celeste');
  });

  it('si no lo conoce, deja el id legible', () => {
    expect(nombreItem('sculk_sensor')).toBe('Sculk sensor');
  });
});

describe('describir', () => {
  it('dice hacia dónde mira y en qué mitad va', () => {
    expect(describir(leerEstado('minecraft:oak_stairs[facing=east,half=top,shape=outer_left]'))).toBe(
      'subiendo hacia el este, en la mitad de arriba, esquina exterior',
    );
    expect(describir(leerEstado('minecraft:furnace[facing=north,lit=false]'))).toBe('mirando al norte');
  });
});

describe('BuildAbierto.ocultar', () => {
  it('lo oculto no se dibuja pero sigue en los materiales', () => {
    const b = new BuildAbierto({
      id: 'x',
      nombre: 'x',
      tam: [2, 1, 1],
      paleta: ['minecraft:stone', 'minecraft:oak_planks'],
      celdas: new Uint16Array([1, 2]),
    } as Build);
    b.ocultar(['stone']);
    expect(b.celda(0, 0, 0)).toBe(0);
    expect(b.celda(1, 0, 0)).toBe(2);
    expect(b.materiales(0, 0)).toHaveLength(2);
    b.ocultar([]);
    expect(b.celda(0, 0, 0)).toBe(1);
  });
});
