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
eq('languageForPath', ['a/b.py', 'x.JSX', 'index.html', 'Makefile', 'c.json'].map(languageForPath), ['python', 'javascriptreact', 'html', undefined, undefined]);
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
const dp = buildDictationSystemPrompt('guiado', 'Objetivo: e-commerce completa, explica cada código que agregues y por qué elegiste esa metodología', true);
eq('prompt de dictado: comentarios antes de cada bloque, metodología y objetivo',
  [dp.includes('ANTES de cada bloque'), dp.includes('METODOLOGÍA'), dp.includes('e-commerce completa'), dp.includes('@ach-concepts')], [true, true, true, true]);

console.log('— fase 3: huecos según lo practicado');
eq('concepto nuevo → sin huecos', T.gapRatio({ nuevos: 2, enPractica: 0, conocidos: 0 }), 0);
eq('en práctica y dominado → más huecos', [T.gapRatio({ nuevos: 0, enPractica: 1, conocidos: 0 }), T.gapRatio({ nuevos: 0, enPractica: 0, conocidos: 2 })], [0.2, 0.4]);
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
eq('sin código corregido salvo en nivel completo',
  [E.buildErrorSystemPrompt('guiado', '').includes('NO escribas el código corregido'), E.buildErrorSystemPrompt('completo', '').includes('## Solución')], [true, true]);

console.log(fails ? `\n${fails} FALLAS` : '\nTodo OK');
process.exit(fails ? 1 : 0);
