# Cómo se trabaja en este proyecto

## Antes de cada commit

`npm run check` tiene que pasar entero: tipos, ESLint, Prettier y tests. Si falla el formato, `npm run format` lo arregla.

## Código

- TypeScript estricto. Nada de `any`; si un dato viene sin tipo (como el NBT), se convierte en un solo lugar.
- Nombres en español, como el resto del proyecto: `capa`, `celda`, `estado`, `materiales`.
- Cada carpeta de `src/` tiene una responsabilidad. Lo que sabe de bloques va en `bloques/`, lo que dibuja va en `vistas/`, y `main.ts` solo conecta.
- Las vistas no guardan estado propio de la página: reciben el build y la capa, y dibujan.
- three.js y JSZip se importan con `import()` dinámico para que la primera carga sea liviana. Mantenerlo así.

## Interfaz

- Íconos solo de Phosphor, versión regular, a través de `src/ui/iconos.ts`. No se dibujan SVG a mano.
- Colores, radios y fuentes salen de las variables de `:root` en `src/estilos.css`. Un solo acento: el naranja.
- Radios: 14px para superficies, 8px para muestras y pastilla completa para todo lo que se toca.
- Todo se prueba en claro y en oscuro, y a 390px de ancho.

## Comentarios

Se comenta el porqué, no el qué. Una o dos líneas, en el tono de alguien que le explica una decisión a quien venga después.

- Bien: `// Litematica empaqueta los índices sin dejar huecos: un índice puede quedar partido entre dos longs`
- Mal: `// Esta función lee los índices` (ya lo dice el nombre)
- Mal: `// Antes esto se hacía con un for, ahora se usa map` (eso va en el historial de git)

Sin guiones largos (el carácter U+2014): se usan dos puntos, comas o una oración aparte.

## Bloques nuevos

- **Nombre en español:** si sale bien con las tablas de `bloques/nombres.ts` (formas, maderas, piedras y colores), no hace falta nada. Si no, se agrega a `FIJOS` con el nombre exacto del juego.
- **Cómo se cuenta:** si en el inventario es otro ítem o guarda varias unidades, va en `bloques/items.ts` con su test en `tests/bloques.test.ts`.
- **Forma en 3D:** `bloques/piezas.ts`. Alcanza con una aproximación que se lea bien.
- **Color y textura:** `bloques/colores.ts` y, si necesita un patrón propio, `texturas/dibujadas.ts`.

## Commits

Asunto de una línea que diga qué cambió, en presente: `Lee regiones de tamaño negativo`.

## Texturas del juego

Ninguna imagen de Minecraft entra al repo. Las texturas del juego se sacan en el navegador del `.jar` o del resource pack que carga cada persona.
