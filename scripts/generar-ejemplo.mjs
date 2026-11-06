// Arma public/ejemplo.json a partir de un .litematic, con el mismo lector que usa la página.
// Uso: npm run ejemplo -- ruta/al/archivo.litematic

import { readFile, writeFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { createServer } from 'vite';

const archivo = process.argv[2];
if (!archivo) {
  console.error('Falta el archivo: npm run ejemplo -- ruta/al/archivo.litematic');
  process.exit(1);
}

// Vite compila el TypeScript del lector al vuelo, así no hay que mantener otra copia en JavaScript
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
  const { leerLitematic } = await vite.ssrLoadModule('/src/litematic/leer.ts');
  const { comprimir } = await vite.ssrLoadModule('/src/litematic/compacto.ts');
  const datos = await readFile(archivo);
  const build = await leerLitematic(
    datos.buffer.slice(datos.byteOffset, datos.byteOffset + datos.byteLength),
    basename(archivo),
  );
  const json = JSON.stringify(comprimir(build));
  await writeFile('public/ejemplo.json', json + '\n');
  console.log(
    `public/ejemplo.json: "${build.nombre}", ${build.tam.join(' × ')}, ${build.bloques} bloques, ${(json.length / 1024).toFixed(0)} KB`,
  );
} finally {
  await vite.close();
}
