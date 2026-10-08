// Pruebas de la lógica pura (sin IDE). 'vscode' solo existe dentro del editor,
// así que se reemplaza por un objeto vacío.
const Module = require('module');
const orig = Module._load;
Module._load = (r, ...a) => (r === 'vscode' ? {} : orig(r, ...a));
const out = require('path').join(__dirname, '..', 'out') + '/';
const { detectInstruction, parseLocalImports, summarizeFile, commentSyntax } = require(out + 'projectContext.js');
const { parseProjectFile, formatProjectForPrompt, nextStep } = require(out + 'projectFile.js');
const { splitStackAnswer } = require(out + 'stackAdvisor.js');
const { buildUserPrompt, extractConcepts } = require(out + 'prompts.js');

let fails = 0;
const eq = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fails++;
  console.log(`${ok ? 'OK  ' : 'FALLA'} ${name}${ok ? '' : `\n      obtuve ${JSON.stringify(got)}\n      quería ${JSON.stringify(want)}`}`);
};

console.log('— detectInstruction');
eq('JS tras Enter', detectInstruction("app.use(x);\n// ach: listar productos con paginación\n"), 'listar productos con paginación');
eq('con indentación', detectInstruction("function f() {\n  // ach: validar email\n  "), 'validar email');
eq('Python #', detectInstruction("import os\n# ach: leer el CSV de ventas\n"), 'leer el CSV de ventas');
eq('HTML <!-- -->', detectInstruction("<body>\n<!-- ach: formulario de login -->\n"), 'formulario de login');
eq('CSS /* */', detectInstruction("body{}\n/* ach: modo oscuro */\n"), 'modo oscuro');
eq('línea en blanco extra', detectInstruction("// ach: una ruta\n\n"), 'una ruta');
eq('aún escribiendo (sin Enter) → nada', detectInstruction("// ach: listar produ"), undefined);
eq('ya hay código debajo → nada', detectInstruction("// ach: una ruta\napp.get("), undefined);
eq('comentario normal → nada', detectInstruction("// guardamos el producto\n"), undefined);
eq('instrucción vieja, lejos → nada', detectInstruction("// ach: vieja\ncodigo();\notra();\n"), undefined);

console.log('— parseLocalImports');
eq('JS require/import locales, ignora npm', parseLocalImports(
  "const express = require('express');\nconst Producto = require('./models/producto');\nimport { db } from '../db';\nimport './estilos.css';\nconst x = await import('./lazy');", 'javascript'),
  ['./models/producto', '../db', './estilos.css', './lazy']);
eq('Python relativos y absolutos', parseLocalImports(
  "from .modelos import Producto\nfrom app.db import sesion\nimport utils", 'python'),
  ['.modelos', 'app.db', 'utils']);

console.log('— summarizeFile');
const schema = "const mongoose = require('mongoose');\nconst productoSchema = new mongoose.Schema({\n  titulo: { type: String, required: true },\n  precio: Number,\n  stock: { type: Number, default: 0 }\n});\nmodule.exports = mongoose.model('Producto', productoSchema);";
eq('archivo chico va completo (se ven los campos)', summarizeFile(schema, 'javascript').includes('titulo') && summarizeFile(schema, 'javascript').includes('stock'), true);
const big = Array.from({length: 400}, (_, i) => `  interno${i}();`).join('\n') + '\nexport function publica(a, b) {}\nexport class Carrito {}\nmodule.exports.helper = 1;';
const sum = summarizeFile(big, 'javascript');
eq('archivo grande → solo declaraciones', [sum.includes('export function publica'), sum.includes('export class Carrito'), sum.includes('interno5')], [true, true, false]);

console.log('— commentSyntax');
eq('js/python/sql/html', ['javascript','python','sql','html'].map(l => commentSyntax(l).open), ['//','#','--','<!--']);

console.log('— parseProjectFile / formatProjectForPrompt');
const proj = parseProjectFile(JSON.stringify({
  prompt: 'API para una tienda',
  stack: { resumen: 'Node + Express 5 + MongoDB', framework: 'Express 5', basura: 42 },
  convenciones: ['CommonJS', 7],
  plan: [{ paso: 'Servidor', archivo: 'server.js', hecho: true }, { paso: 'Modelo', archivo: 'models/producto.js', concepto: 'esquemas' }, { sin: 'paso' }]
}));
eq('descarta tipos inválidos', [Object.keys(proj.stack), proj.convenciones, proj.plan.length], [['resumen','framework'], ['CommonJS'], 2]);
eq('siguiente paso = primero sin hacer', nextStep(proj).paso, 'Modelo');
const block = formatProjectForPrompt(proj);
eq('bloque con objetivo, stack y paso actual', [block.includes('Objetivo: API para una tienda'), block.includes('Express 5'), block.includes('1/2 pasos'), block.includes('Paso actual del plan: Modelo (archivo models/producto.js) — concepto a enseñar: esquemas')], [true,true,true,true]);
eq('JSON roto → undefined (no rompe nada)', parseProjectFile('{ esto no es json'), undefined);

console.log('— splitStackAnswer');
const answer = "## Tu stack\nFastAPI...\n\n```ach-project\n{\"stack\":{\"resumen\":\"Python + FastAPI + PostgreSQL\",\"lenguaje\":\"Python 3.12\"},\"convenciones\":[\"routers en app/routers\"],\"plan\":[{\"paso\":\"App base\",\"archivo\":\"app/main.py\",\"concepto\":\"rutas\"}]}\n```";
const r = splitStackAnswer(answer);
eq('separa markdown del bloque', r.markdown, '## Tu stack\nFastAPI...');
eq('propuesta estructurada', [r.proposal.stack.resumen, r.proposal.plan[0].archivo, 'prompt' in r.proposal], ['Python + FastAPI + PostgreSQL', 'app/main.py', false]);
eq('sin bloque → solo markdown', splitStackAnswer('## Hola').proposal, undefined);

console.log('— buildUserPrompt');
const up = buildUserPrompt('javascript', 'routes/productos.js', 'pre', 'suf', '--- models/producto.js ---\ntitulo', 'listar con paginación');
eq('incluye relacionados e instrucción', [up.includes('<ARCHIVOS RELACIONADOS'), up.includes('INSTRUCCIÓN DEL USUARIO (prioridad máxima): listar con paginación')], [true, true]);

console.log('— extractConcepts (marcador de conceptos)');
eq('JS //', extractConcepts('// @ach-concepts: async/await, try/catch\ncode();').concepts, ['async/await','try/catch']);
eq('C /* */ quita el cierre', extractConcepts('/* @ach-concepts: punteros */\nint *p;').concepts, ['punteros']);
eq('sin marcador (stream cortado)', extractConcepts('const x = 1;'), { text: 'const x = 1;', concepts: [] });
eq('máximo 4', extractConcepts('// @ach-concepts: a, b, c, d, e\nx();').concepts.length, 4);

console.log('— fase 2: perfiles de stack');
const { PROFILES, matchProfile, packageName, getProfile } = require(out + 'stackProfiles.js');
const id = (t) => matchProfile(t)?.id;
eq('matchProfile casos claros',
  [id('Node.js con Express y MongoDB'), id('quiero usar fastapi'), id('React con Vite'), id('Django'), id('HTML y CSS puro')],
  ['node-express', 'python-fastapi', 'react-vite', 'django', 'web-basica']);
eq('matchProfile ambiguo o desconocido → sin perfil',
  [id('python'), id('Go con Gin'), id('un frontend en Vue'), id(''), id(undefined)],
  [undefined, undefined, undefined, undefined, undefined]);
eq('packageName válido para npm', [packageName('Mi Tienda Ñandú!'), packageName('---')], ['mi-tienda-nandu', 'mi-proyecto']);
const jsonSchema = require(require('path').join(__dirname, '..', 'schemas', 'autocompletehelp.schema.json'));
eq('esquema y perfiles sincronizados', jsonSchema.properties.perfil.enum.slice().sort(), PROFILES.map((x) => x.id).sort());
eq('manifiestos JSON de los perfiles son válidos', PROFILES.every((pr) => pr.base.every((b) => !b.archivo.endsWith('.json') || JSON.parse(b.contenido))), true);
eq('django no pre-crea archivos del plan (romperían startproject)', getProfile('django').crearArchivosDelPlan, false);

console.log('— fase 2: instrucciones de pasos');
const { stepInstruction, languageForPath, stepFileContent, findStepLine } = require(out + 'instructions.js');
const paso = { paso: 'Listar', concepto: 'rutas' };
eq('findStepLine: archivo de «Crear estructura» → paso sin empezar (no se duplica)', findStepLine(stepFileContent('r.js', paso), paso), { line: 0, hasCodeAfter: false });
eq('findStepLine: con código debajo', findStepLine('x\n// ach: Listar (enseña: rutas)\nrouter.get();\n', paso), { line: 1, hasCodeAfter: true });
eq('findStepLine: instrucción ausente', findStepLine('const a = 1;', paso), undefined);
eq('stepInstruction', stepInstruction({ paso: 'Listar productos', concepto: 'paginación' }), 'Listar productos (enseña: paginación)');
eq('languageForPath', ['a/b.py', 'x.JSX', 'index.html', 'Makefile', 'c.json'].map(languageForPath), ['python', 'javascriptreact', 'html', 'makefile', undefined]);
eq('archivo nuevo: solo la instrucción, con sintaxis del lenguaje', [
  stepFileContent('app/main.py', { paso: 'App base' }),
  stepFileContent('index.html', { paso: 'Estructura' }),
  stepFileContent('css/e.css', { paso: 'Estilos' }),
  stepFileContent('package.json', { paso: 'x' })
], ['# ach: App base\n', '<!-- ach: Estructura -->\n', '/* ach: Estilos */\n', '']);
eq('la instrucción del archivo nuevo dispara la sugerencia (detectInstruction)',
  detectInstruction(stepFileContent('routes/items.js', { paso: 'Listar', concepto: 'rutas' })), 'Listar (enseña: rutas)');

console.log('— fase 2: crear estructura');
const { scaffoldEntries } = require(out + 'scaffold.js');
const planNode = { prompt: 'x', plan: [
  { paso: 'Servidor', archivo: 'server.js' }, { paso: 'Modelo', archivo: 'models/item.js' },
  { paso: 'Errores', archivo: './server.js' }, { paso: 'Malicioso', archivo: '../fuera.js' }, { paso: 'Sin archivo' } ] };
const ent = scaffoldEntries(planNode, getProfile('node-express'), 'Mi Tienda');
eq('node: base + .gitignore + archivos del plan sin duplicados ni rutas fuera del proyecto',
  ent.map((e) => e.archivo), ['package.json', '.env.example', '.env', '.gitignore', 'server.js', 'models/item.js']);
eq('package.json con el nombre de la carpeta', JSON.parse(ent[0].contenido).name, 'mi-tienda');
eq('.gitignore protege secretos y dependencias', ent[3].contenido, 'node_modules/\n.env\n');
eq('archivos de código nacen vacíos salvo la instrucción', ent[4].contenido, '// ach: Servidor\n');
eq('django: solo archivos base', scaffoldEntries(planNode, getProfile('django'), 'x').map((e) => e.archivo), ['requirements.txt', '.gitignore']);
eq('sin perfil: solo archivos del plan', scaffoldEntries(planNode, undefined, 'x').map((e) => e.archivo), ['server.js', 'models/item.js']);

console.log('— fase 2: combinar propuesta del modelo con el perfil');
const { mergeWithProfile } = require(out + 'stackAdvisor.js');
const llm = { stack: { resumen: 'Node + Express 4' }, convenciones: ['ESM'], plan: [{ paso: 'Carrito', archivo: 'routes/carrito.js' }] };
const merged = mergeWithProfile(llm, getProfile('node-express'));
eq('el perfil manda en stack y convenciones; el plan es el del modelo',
  [merged.perfil, merged.stack.framework, merged.convenciones[0], merged.plan[0].paso], ['node-express', 'Express 5', 'CommonJS (require/module.exports)', 'Carrito']);
eq('sin respuesta del modelo → plan base del perfil', mergeWithProfile(undefined, getProfile('react-vite')).plan.length, getProfile('react-vite').planBase.length);
eq('sin perfil → propuesta tal cual; sin stack → nada', [mergeWithProfile(llm, undefined).stack.resumen, mergeWithProfile({ plan: [] }, undefined)], ['Node + Express 4', undefined]);
eq('parseProjectFile lee el perfil', parseProjectFile('{"prompt":"x","perfil":"django"}').perfil, 'django');
const { buildStackSystemPrompt } = require(out + 'prompts.js');
eq('prompt del asesor incluye el perfil curado', buildStackSystemPrompt('Django', getProfile('django')).includes('PERFIL CURADO'), true);

console.log('— fase 3: dictado (escribir encima del gris)');
const T = require(out + 'typing.js');
const js = T.commentPrefixes('javascript');
const dict = "// Primero importamos express: es el framework.\nconst express = require('express');\n\n// Creamos la app en vez de usar http a mano.\nconst app = express();\napp.get('/', (req, res) => {\n  res.send('Hola');\n});";
const mask = T.autoMask(dict, js);
let pos = T.skipAuto(mask, 0);
eq('el primer comentario avanza solo: arrancas en el código', dict.slice(pos, pos + 5), 'const');
let k = T.typeKeys(dict, mask, pos, 'const');
eq('acierto avanza', [k.ok, dict.slice(k.pos, k.pos + 8)], [true, ' express']);
const err = T.typeKeys(dict, mask, k.pos, 'x');
eq('error no avanza y dice qué esperaba', [err.ok, err.pos === k.pos, err.expected], [false, true, ' ']);
k = T.typeKeys(dict, mask, k.pos, " express = require('express');");
eq('al terminar la línea se espera Enter', dict[k.pos], '\n');
k = T.typeKeys(dict, mask, k.pos, '\n');
eq('Enter salta la línea en blanco y el comentario siguiente', dict.slice(k.pos, k.pos + 9), 'const app');
k = T.typeKeys(dict, mask, k.pos, "const app = express();\napp.get('/', (req, res) => {\n");
eq('la indentación avanza sola', dict.slice(k.pos, k.pos + 3), 'res');
eq('retroceso vuelve al último carácter tecleado, no a la indentación', dict[T.backPos(mask, k.pos)], '\n');
eq('Tab dicta una palabra', dict.slice(k.pos, T.nextWordEnd(dict, mask, k.pos)), 'res');
eq('la explicación dictada es el comentario del bloque', T.explanationAt(dict, k.pos, js), 'Creamos la app en vez de usar http a mano.');
eq('progreso parcial', T.progressOf(mask, k.pos) > 50 && T.progressOf(mask, k.pos) < 100, true);
k = T.typeKeys(dict, mask, k.pos, "res.send('Hola');\n});");
eq('fin del dictado', [k.ok, k.pos, T.progressOf(mask, k.pos)], [true, dict.length, 100]);
eq('las tildes no frenan: «a» vale por «á»', T.typeKeys("x = 'número'", T.autoMask("x = 'número'", js), 0, "x = 'numero'").ok, true);
eq('con typeComments el comentario se escribe', T.skipAuto(T.autoMask(dict, js, true), 0), 0);
const py = "# Leemos el archivo con with: lo cierra aunque falle.\nwith open('a.txt') as f:\n    datos = f.read()";
const pm = T.autoMask(py, T.commentPrefixes('python'));
eq('python: # avanza solo', py.slice(T.skipAuto(pm, 0), T.skipAuto(pm, 0) + 4), 'with');
const { buildDictationSystemPrompt } = require(out + 'prompts.js');
const dp = buildDictationSystemPrompt('Objetivo: e-commerce completa, explica cada código que agregues y por qué elegiste esa metodología', true);
eq('prompt de dictado: comentarios antes de cada bloque, metodología y objetivo',
  [dp.includes('ANTES de cada bloque'), dp.includes('METODOLOGÍA'), dp.includes('e-commerce completa'), dp.includes('@ach-concepts')], [true, true, true, true]);

console.log('— fase 3: huecos (solo en los repasos)');
const gaps = T.chooseGaps(dict, mask, 0.4, 7);
eq('huecos deterministas con la misma semilla', JSON.stringify(gaps) === JSON.stringify(T.chooseGaps(dict, mask, 0.4, 7)), true);
eq('nunca en comentarios ni en la primera palabra', gaps.every(([s]) => !mask[s]) && gaps[0][0] > dict.indexOf('const'), true);
eq('solo palabras completas de 3+ letras', gaps.every(([s, e]) => /^[A-Za-z_$][\w$]{2,}$/.test(dict.slice(s, e))), true);
eq('sin práctica, sin huecos', T.chooseGaps(dict, mask, 0, 7), []);
eq('inGap', [T.inGap([[5, 9]], 5), T.inGap([[5, 9]], 9)], [true, false]);
eq('lo gris es lo pendiente menos los huecos', T.subtractRanges(0, 20, [[3, 5], [10, 12]]), [[0, 3], [5, 10], [12, 20]]);
eq('huecos pendientes recortados al cursor', T.clipRanges(4, 20, [[3, 5], [10, 12], [25, 30]]), [[4, 5], [10, 12]]);

console.log('— fase 3: repaso espaciado');
const R = require(out + 'review.js');
const day = 24 * 3600 * 1000;
const t0 = Date.parse('2026-10-01T10:00:00Z');
const st = (o) => Object.assign({ label: 'x', seen: 3, accepted: 0, practiced: 1, firstSeen: '2026-09-01T00:00:00Z', lastSeen: new Date(t0).toISOString() }, o);
const led = {
  'async-await': st({ label: 'async/await' }),
  'promesas': st({ label: 'promesas', reviewBox: 2, lastReview: new Date(t0 - 8 * day).toISOString() }),
  'solo-aceptado': st({ label: 'solo aceptado', practiced: 0 })
};
eq('vence al día siguiente de escribirlo', R.dueConcepts(led, t0 + 0.5 * day).map((d) => d.id), ['promesas']);
eq('al día siguiente, también el nuevo; el más atrasado primero', R.dueConcepts(led, t0 + 1 * day).map((d) => d.id), ['promesas', 'async-await']);
eq('lo que nunca escribiste no entra al repaso', R.dueConcepts(led, t0 + 100 * day).some((d) => d.id === 'solo-aceptado'), false);
eq('repaso bien hecho sube de caja', R.applyReview(st({ reviewBox: 1 }), { errors: 1, helped: 1, gaps: 6 }).reviewBox, 2);
eq('repaso que costó vuelve a la primera', R.applyReview(st({ reviewBox: 3 }), { errors: 6, helped: 0, gaps: 6 }).reviewBox, 0);
eq('la última caja no se pasa', R.applyReview(st({ reviewBox: 4 }), { errors: 0, helped: 0, gaps: 6 }).reviewBox, 4);
eq('lenguaje del ejercicio según el stack', [R.reviewLanguage('Python + FastAPI').languageId, R.reviewLanguage('Node.js + Express').languageId], ['python', 'javascript']);

console.log('— fase 3: entender errores');
const E = require(out + 'errorHelp.js');
const errPrompt = E.buildErrorUserPrompt('javascript', 'server.js', "Cannot find name 'expres'.", 'ts 2304', 9, ['a();', 'expres();', 'b();'], 10, 10);
eq('marca la línea del error con su número real', errPrompt.split('\n').filter((l) => l.startsWith('>>')), ['>> 11 | expres();']);
eq('incluye mensaje y origen', errPrompt.includes("Error (ts 2304): Cannot find name 'expres'."), true);
eq('nunca da el código corregido', [E.buildErrorSystemPrompt('').includes('NO escribas el código corregido'), E.buildErrorSystemPrompt('').includes('## Solución')], [true, false]);

console.log('— completamos juntos: una línea a la vez');
const cj = "// Importamos express: el framework.\nconst express = require('express');\n\n// La app.\nconst app = express();\n// ➜ Siguiente paso: rutas";
const cjm = T.autoMask(cj, js);
const p0 = T.skipAuto(cjm, 0);
eq('al empezar se ve el comentario y la primera línea, nada más', cj.slice(0, T.revealEnd(cj, p0)), "// Importamos express: el framework.\nconst express = require('express');");
const p1 = T.typeKeys(cj, cjm, p0, "const express = require('express');\n").pos;
eq('tras Enter aparece el comentario y la línea siguiente', cj.slice(T.revealEnd(cj, p0), T.revealEnd(cj, p1)), "\n\n// La app.\nconst app = express();");
const p2 = T.typeKeys(cj, cjm, p1, 'const app = express();\n').pos;
eq('al terminar se muestra el comentario final', [p2, T.revealEnd(cj, p2)], [cj.length, cj.length]);
eq('a mitad de línea, lo visible llega hasta el fin de esa línea', T.revealEnd(cj, p0 + 6), cj.indexOf('\n', p0));
eq('prompt: una línea a la vez y la arquitectura en el primer comentario', [dp.includes('UNA línea de código a la vez'), dp.includes('ARQUITECTURA')], [true, true]);

console.log('— arquitectura y diseño de sistemas');
const A = require(out + 'architectures.js');
eq('catálogo completo: cada arquitectura explica cuándo sí, cuándo no, reglas y diagrama',
  A.ARCHITECTURES.every((a) => a.cuandoSi.length && a.cuandoNo.length && a.reglas.length && a.carpetas.length && a.diagrama.startsWith('flowchart')), true);
const rec = (o) => A.recommendArchitecture(Object.assign({ tipo: 'api', equipo: 'solo', areas: 'pocas', objetivo: 'fundamentos' }, o)).recomendada;
eq('API simple para aprender → monolito en capas', rec({}), 'capas');
eq('varias áreas → monolito modular', rec({ areas: 'varias' }), 'modular');
eq('quiere practicar diseño → hexagonal', rec({ objetivo: 'diseno' }), 'hexagonal');
eq('varios equipos y varias áreas → microservicios', rec({ equipo: 'varios', areas: 'varias' }), 'microservicios');
eq('web con páginas del servidor → MVC; frontend → componentes', [rec({ tipo: 'web-servidor' }), rec({ tipo: 'frontend' })], ['mvc', 'componentes']);
eq('microservicios nunca es la recomendación para una persona sola', ['pocas', 'varias'].flatMap((areas) => ['fundamentos', 'diseno'].map((objetivo) => rec({ areas, objetivo }))).includes('microservicios'), false);
eq('la recomendada siempre aplica al tipo de app', ['api', 'web-servidor', 'frontend', 'otra'].every((tipo) => A.getArchitecture(rec({ tipo })).tipos.includes(tipo)), true);
eq('tipo de app según el perfil', [A.appKindForProfile('django'), A.appKindForProfile('react-vite'), A.appKindForProfile('node-express'), A.appKindForProfile('x')], ['web-servidor', 'frontend', 'api', undefined]);
const hex = A.getArchitecture('hexagonal');
const adr = A.architectureDoc(hex, { prompt: 'e-commerce completa', stack: 'Node.js + Express 5', razones: ['Practicar diseño.'], alternativas: ['capas', 'clean'], fecha: '2026-10-08' });
eq('registro de decisión con contexto, decisión, alternativas, consecuencias y diagrama',
  ['## Contexto', '## Decisión', '## Alternativas consideradas', '## Consecuencias', '```mermaid', 'Monolito en capas'].every((x) => adr.includes(x)), true);
eq('explicación con cuándo no y costo', ['## Cuándo no', '## Lo que se paga', '## Reglas que vas a respetar'].every((x) => A.explainArchitecture(hex).includes(x)), true);
const pa = parseProjectFile(JSON.stringify({ prompt: 'x', arquitectura: { estilo: 'hexagonal', nombre: 'Hexagonal', reglas: ['El dominio no importa nada de afuera.', 3] } }));
eq('autocompletehelp.json guarda la arquitectura (y descarta basura)', [pa.arquitectura.estilo, pa.arquitectura.reglas], ['hexagonal', ['El dominio no importa nada de afuera.']]);
eq('sin estilo no hay arquitectura', parseProjectFile('{"prompt":"x","arquitectura":{"nombre":"y"}}').arquitectura, undefined);
eq('la IA recibe la arquitectura y sus reglas', formatProjectForPrompt(pa).includes('Arquitectura: Hexagonal') && formatProjectForPrompt(pa).includes('El dominio no importa'), true);
eq('el plan se arma con la arquitectura elegida', buildStackSystemPrompt('Node', undefined, hex).includes('ARQUITECTURA ELEGIDA: Hexagonal (puertos y adaptadores)'), true);
eq('el esquema JSON conoce todas las arquitecturas', JSON.stringify(jsonSchema.properties.arquitectura.properties.estilo.enum), JSON.stringify(A.ARCHITECTURES.map((a) => a.id)));

console.log('— quiero aprender');
const L = require(out + 'learnTopics.js');
eq('temas curados por palabra clave', ['quiero aprender typescript', 'Three.js', 'arquitectura hexagonal', 'automatizaciones con Python', 'Docker y compose'].map((x) => L.matchTopic(x)?.id),
  ['typescript', 'threejs', 'hexagonal', 'automatizacion-python', 'docker']);
eq('palabra completa: «ts» no coincide dentro de «tests»; gana la clave más larga', [L.matchTopic('tests unitarios')?.id, L.matchTopic('clean architecture con node')?.id], ['testing', 'clean']);
eq('tema desconocido → sin semilla (lo diseña la IA)', L.matchTopic('Rust embebido'), undefined);
eq('cada tema curado usa una arquitectura del catálogo', L.LEARN_TOPICS.every((t) => !!A.getArchitecture(t.arquitectura)), true);
const lp = L.buildLearnSystemPrompt({ tema: 'Three.js', nivel: 'cero', tamano: 'corto', topic: L.matchTopic('three.js') });
eq('prompt: tests obligatorios, Docker solo si hace falta, arquitecturas del catálogo y semilla',
  [lp.includes('TESTS OBLIGATORIOS'), lp.includes('## Docker'), lp.includes('hexagonal, clean'), lp.includes('SEMILLA CURADA'), lp.includes('nunca programó')], [true, true, true, true, true]);
const learnJson = {
  proyecto: 'gestor de gastos en TypeScript; explica cada tipo',
  objetivos: ['tipos', 'interfaces', 'tests'],
  stack: { resumen: 'TypeScript 5 + Node 22 + Vitest', tests: 'Vitest' },
  convenciones: ['ES modules'],
  arquitectura: 'capas',
  entorno: {
    instalar: [{ comando: 'npm install -D typescript vitest', explicacion: 'compilador y tests' }, { comando: '' }],
    testear: { comando: 'npx vitest run', explicacion: 'corre los tests' },
    docker: null
  },
  plan: [
    { paso: 'Configurar TypeScript', tipo: 'config', archivo: 'tsconfig.json', concepto: 'compilador' },
    { paso: 'Tipos de un gasto', tipo: 'codigo', archivo: './src/tipos.ts', concepto: 'interfaces' },
    { paso: 'Test del total', tipo: 'test', archivo: 'src/gastos.test.ts', concepto: 'tests', verificar: 'npx vitest run' },
    { paso: 'Ruta peligrosa', tipo: 'codigo', archivo: '../fuera.ts' },
    { paso: 'Correr la app', tipo: 'comando', comando: 'npx tsx src/main.ts', explicacion: 'ejecuta sin compilar' },
    { paso: 'Tipo inventado', tipo: 'magia', archivo: 'x.ts' }
  ]
};
const parsed = L.parseLearnAnswer('## Qué vas a construir\nUn gestor.\n```ach-learn\n' + JSON.stringify(learnJson) + '\n```');
const pr = parsed.proposal;
eq('separa la guía del JSON', parsed.markdown, '## Qué vas a construir\nUn gestor.');
eq('pasos tipados, rutas dentro del proyecto, tipo desconocido descartado',
  pr.plan.map((s) => [s.tipo, s.archivo]), [['config', 'tsconfig.json'], ['codigo', 'src/tipos.ts'], ['test', 'src/gastos.test.ts'], ['codigo', undefined], ['comando', undefined], [undefined, 'x.ts']]);
eq('comandos vacíos fuera; docker null → sin docker', [pr.entorno.instalar.length, pr.entorno.docker, pr.entorno.testear.comando], [1, undefined, 'npx vitest run']);
eq('arquitectura inventada → ninguna', L.parseLearnAnswer('```ach-learn\n' + JSON.stringify(Object.assign({}, learnJson, { arquitectura: 'cuantica' })) + '\n```').proposal.arquitectura, undefined);
eq('sin plan o JSON roto → sin proyecto', [L.parseLearnAnswer('```ach-learn\n{"stack":{"resumen":"x"},"plan":[]}\n```').proposal, L.parseLearnAnswer('```ach-learn\n{roto\n```').proposal], [undefined, undefined]);
const lpf = L.learnProjectFile(pr, { tema: 'TypeScript', nivel: 'cero' });
eq('autocompletehelp.json del proyecto de aprendizaje', [lpf.aprender.tema, lpf.aprender.nivel, lpf.arquitectura.estilo, lpf.plan.length, !!lpf.entorno], ['TypeScript', 'nunca programó', 'capas', 6, true]);
const round = parseProjectFile(JSON.stringify(lpf));
eq('se relee igual (tipo, verificar, comando, entorno, aprender)', [round.plan[2].verificar, round.plan[4].comando, round.entorno.testear.comando, round.aprender.objetivos.length], ['npx vitest run', 'npx tsx src/main.ts', 'npx vitest run', 3]);
eq('la IA sabe qué tema se aprende y cómo se comprueba el paso', [formatProjectForPrompt(round).includes('Proyecto para APRENDER TypeScript'), formatProjectForPrompt(round).includes('[config]')], [true, true]);
const { environmentSteps } = require(out + 'projectFile.js');
eq('entorno en orden: instalar → Docker → ejecutar → tests', environmentSteps({ instalar: [{ comando: 'a' }], docker: { porQue: 'db', comandos: [{ comando: 'docker compose up -d' }] }, ejecutar: { comando: 'b' }, testear: { comando: 'c' } }).map((x) => x.grupo + ':' + x.comando),
  ['Instalar:a', 'Docker:docker compose up -d', 'Ejecutar:b', 'Tests:c']);
eq('guía docs/APRENDER.md', L.learnGuideDoc('## Paso a paso\nuno', 'Three.js', '2026-10-08').startsWith('# Aprender Three.js'), true);
eq('nombre de carpeta', [L.folderNameFor('Three.js'), L.folderNameFor('Automatizaciones con Python')], ['aprender-three-js', 'aprender-automatizaciones-con-python']);
const { languageForPath: lfp } = require(out + 'instructions.js');
eq('Dockerfile y compose se reconocen', [lfp('Dockerfile'), lfp('docker/api.Dockerfile'), lfp('docker-compose.yml'), lfp('.env')], ['dockerfile', 'dockerfile', 'yaml', 'shellscript']);
const scaffold = require(out + 'scaffold.js').scaffoldEntries(lpf, undefined, 'aprender-typescript');
eq('crear estructura: archivos del plan, sin los pasos de comando', scaffold.map((e) => e.archivo), ['tsconfig.json', 'src/tipos.ts', 'src/gastos.test.ts', 'x.ts']);
eq('el esquema JSON conoce los tipos de paso', JSON.stringify(jsonSchema.properties.plan.items.properties.tipo.enum), JSON.stringify(require(out + 'projectFile.js').STEP_KINDS));

console.log(fails ? `\n${fails} FALLAS` : '\nTodo OK');
process.exit(fails ? 1 : 0);
