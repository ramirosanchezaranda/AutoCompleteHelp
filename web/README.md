# AutoCompleteHelp Web

La versión web (PWA) de AutoCompleteHelp: aprender a programar construyendo proyectos reales y **escribiendo cada línea**, en el celular, la tablet o la computadora. Basada en [docs/PRD-webapp.md](../docs/PRD-webapp.md).

## Cómo está armada

- **Núcleo compartido**: la lógica pura de la extensión vive en [`src/core`](../src/core) (motor de dictado, catálogo, lecciones, arquitecturas, prompts, parsers `ach-*`, `autocompletehelp.json`, proveedores de IA). La extensión y la web importan lo mismo: la web lo usa con el alias `@core`.
- **React 19 + Vite + TypeScript**, PWA instalable y offline (service worker con Workbox). Lo pesado (editor, catálogo) se carga al usarse: ~245 KB de JS inicial.
- **Editor**: CodeMirror 6. El motor decide qué se ve (gris, carácter siguiente, error, huecos); CodeMirror solo pinta. Un campo invisible recibe el teclado (también el del celular).
- **Ejecutar en el navegador** (sin WebContainers, sin licencias): Sucrase transforma TS/JS a CommonJS y un cargador propio corre los módulos.
  - Tests JS/TS en un Web Worker con un vitest mínimo compatible (`describe`, `it`, `expect`, `vi.fn`…): rojo → verde.
  - Programas de terminal: `npx tsx src/main.ts args` (con `process.argv`).
  - Vista previa en un iframe con sandbox: paquetes de npm desde esm.sh, `?raw` para shaders, errores de la GPU marcados en la línea del editor, velocidad 0.25×/0.5×/1×.
  - Python, Docker y la nube se explican y se copian para correrlos en la computadora.
- **Datos**: proyectos y progreso en IndexedDB; las API keys cifradas con WebCrypto (clave AES no exportable). Export/import `.zip` con el mismo `autocompletehelp.json` que la extensión.
- **IA a elección**: proveedores con API key (llamadas directas desde el navegador; Anthropic con `anthropic-dangerous-direct-browser-access`), IA local (Ollama, LM Studio, llama.cpp, Jan) o propia (OpenAI-compatible), o sin IA. Proxy sin estado opcional y autohospedable en [`proxy/`](proxy/api/ai.ts).

## Teoría y ejercicios

En «Quiero aprender», cada tema se puede aprender **con un proyecto** o **con teoría y ejercicios**:

- **Sin IA**: cuatro cursos escritos y verificados con Vitest (con las soluciones, todo verde; con los enunciados, todo rojo), en [`src/core/lessonsCursos.ts`](../src/core/lessonsCursos.ts): Fundamentos de programación, Lógica para programar, Matemáticas para programar y Diseño con JavaScript.
- **Con IA**: cualquier tema de cualquier sección. La IA arma el temario con el mismo formato.

Cada tema son tres pasos que se completan escribiendo: el apunte (`notas/`), los tests y el ejercicio (`tipo: "ejercicio"`). El ejercicio arranca con el enunciado y las funciones vacías y se resuelve escribiendo libre. Las pistas salen de los comentarios de la solución (o de la IA, sin dar la solución). La solución guiada se escribe línea por línea. Cuando sus tests pasan a verde, el ejercicio queda resuelto.

## Desarrollo

```bash
cd web
npm install
npm run dev      # http://localhost:5173
npm test         # motor de dictado y ejecución de lecciones
npm run build
```

## Pendiente (fases 3 y 4 del PRD)

Python/pytest en el navegador (Pyodide), cuenta y sincronización, publicar a GitHub, modo docente. «Depurar como color» en shaders.
