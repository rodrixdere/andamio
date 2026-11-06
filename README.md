# Andamio

Para seguir un build de Minecraft capa por capa. Se agrega un archivo `.litematic` y la página muestra cada capa desde arriba, de lado y en 3D, con la lista de materiales que lleva.

- Los archivos se leen en el navegador y no se suben a ningún lado. Quedan guardados en ese navegador.
- Las texturas vienen dibujadas por material. Para ver las del juego se carga el `.jar` de Minecraft o un resource pack `.zip`, que también se procesa en el navegador. Ninguna imagen del juego forma parte del repo.
- Los nombres de los ítems están en español, como en el juego.

## Cómo usarlo

```
npm install
npm run dev
```

| Comando                                | Qué hace                                                                |
| -------------------------------------- | ----------------------------------------------------------------------- |
| `npm run dev`                          | Servidor local con recarga                                              |
| `npm run build`                        | Revisa los tipos y arma el sitio en `dist/`                             |
| `npm run preview`                      | Sirve `dist/` para probar el build de producción                        |
| `npm test`                             | Corre los tests                                                         |
| `npm run check`                        | Tipos, lint, formato y tests; lo que tiene que pasar antes de un commit |
| `npm run ejemplo -- archivo.litematic` | Regenera `public/ejemplo.json` desde un `.litematic`                    |

Hace falta Node 20 o más nuevo.

## Estructura

```
src/
  main.ts            Arranque, estado de la página y eventos
  modelo.ts          Build abierto: acceso a celdas y conteo de materiales
  almacen.ts         Guardado en el navegador (IndexedDB y preferencias)
  tipos.ts
  litematic/         Lectura del archivo: NBT, regiones y formato compacto del ejemplo
  bloques/           Lo que se sabe de cada bloque: nombres, ítems, colores, forma en 3D
  texturas/          Texturas dibujadas y las sacadas del juego
  vistas/            Plano 2D (arriba y de lado) y vista 3D con three.js
  ui/                Íconos, listas de builds y de materiales
public/
  ejemplo.json       Build que se carga al abrir; si no está, la página arranca vacía
tests/               Tests de lectura y de reglas de materiales
scripts/             Herramientas de desarrollo
```

## El ejemplo

`public/ejemplo.json` es "Medieval house" de agustin123jr. Antes de publicar el repo conviene tener su permiso o reemplazarlo por un build propio con `npm run ejemplo`. Si se borra el archivo, la página abre pidiendo el primer build.

## Publicarlo

- **Netlify:** toma la configuración de `netlify.toml` (`npm run build`, carpeta `dist`).
- **Vercel:** detecta Vite solo. Build command `npm run build`, output `dist`.

## Límites conocidos

- Solo lee `.litematic`. Los `.schem` y `.nbt` se pueden pasar a `.litematic` desde Litematica.
- En 3D las escaleras de esquina se ven rectas y los bloques con caras distintas usan una sola textura.
