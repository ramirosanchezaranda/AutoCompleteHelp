import type { PlanStep, StackInfo } from './project';

/**
 * Perfiles de stack curados, pensados para aprender. Dan tres cosas que un LLM
 * no garantiza por sí solo:
 *  - convenciones estables: el mismo stack produce el mismo estilo en cada archivo;
 *  - archivos base correctos (manifiesto, .gitignore) sin versiones inventadas:
 *    las dependencias se instalan por nombre, así npm/pip traen la versión actual
 *    y el contexto del proyecto lee luego la versión real instalada;
 *  - comandos de instalación y ejecución explicados, para aprenderlos en vez
 *    de ejecutarlos a ciegas.
 */

export interface ProfileCommand {
  comando: string;
  /** Variante para Windows, si difiere. */
  windows?: string;
  explicacion: string;
}

export interface ProfileFile {
  archivo: string;
  contenido: string;
  motivo: string;
}

export interface StackProfile {
  id: string;
  nombre: string;
  para: string;
  porQue: string;
  /** Palabras que identifican este stack en lo que escribe el usuario. */
  palabras: string[];
  stack: StackInfo;
  convenciones: string[];
  /** Archivos base: manifiesto, variables de entorno… (nunca código de la app). */
  base: ProfileFile[];
  gitignore: string[];
  instalar?: ProfileCommand;
  ejecutar?: ProfileCommand;
  /**
   * false cuando la herramienta del stack genera su propia estructura (Django):
   * crear antes los archivos del plan haría fallar ese comando.
   */
  crearArchivosDelPlan: boolean;
  nota?: string;
  /** Plan de ejemplo: guía al LLM y sirve de respaldo si no hay conexión. */
  planBase: PlanStep[];
}

export const PROFILES: StackProfile[] = [
  {
    id: 'web-basica',
    nombre: 'HTML + CSS + JavaScript',
    para: 'Páginas y apps web sencillas; el mejor punto de partida desde cero',
    porQue: 'Nada que instalar ni configurar: lo que escribes lo ves en el navegador. Aprendes la base sobre la que se apoyan todos los frameworks.',
    palabras: ['html', 'css', 'vanilla', 'javascript puro', 'sin framework', 'pagina web', 'web basica', 'landing'],
    stack: {
      resumen: 'HTML + CSS + JavaScript (sin framework)',
      lenguaje: 'HTML5, CSS3 y JavaScript moderno (ES modules)',
      framework: 'ninguno, a propósito: primero el DOM',
      herramienta: 'navegador; opcional: extensión Live Server'
    },
    convenciones: [
      'index.html en la raíz',
      'estilos en css/estilos.css',
      'lógica en js/app.js, cargado con <script type="module">',
      'sin librerías hasta dominar el DOM y los eventos'
    ],
    base: [],
    gitignore: ['.DS_Store'],
    ejecutar: {
      comando: 'npx serve .',
      explicacion:
        'Levanta un servidor local para ver la página en http://localhost:3000. Hace falta porque los ES modules no cargan abriendo el archivo con doble clic. Alternativa: la extensión Live Server.'
    },
    crearArchivosDelPlan: true,
    planBase: [
      { paso: 'Estructura de la página', archivo: 'index.html', concepto: 'etiquetas HTML semánticas' },
      { paso: 'Estilos base', archivo: 'css/estilos.css', concepto: 'selectores, cascada y modelo de caja' },
      { paso: 'Interacción', archivo: 'js/app.js', concepto: 'DOM y eventos' }
    ]
  },
  {
    id: 'node-express',
    nombre: 'Node.js + Express 5 + MongoDB',
    para: 'APIs REST y backends',
    porQue: 'Un solo lenguaje (JavaScript) para todo, mucha documentación en español, y los conceptos (rutas, middlewares, modelos) sirven en cualquier backend.',
    palabras: ['node', 'nodejs', 'express', 'mongo', 'mongoose', 'mongodb'],
    stack: {
      resumen: 'Node.js + Express 5 + MongoDB',
      lenguaje: 'JavaScript (Node.js 22 LTS)',
      framework: 'Express 5',
      datos: 'MongoDB con Mongoose 8',
      tests: 'node:test (incluido en Node)'
    },
    convenciones: [
      'CommonJS (require/module.exports)',
      "cada archivo de routes/ se monta en server.js con app.use('/<recurso>', router)",
      'un modelo por colección en models/',
      'rutas async sin try/catch: Express 5 pasa los errores al manejador',
      'configuración en variables de entorno (.env), nunca en el código'
    ],
    base: [
      {
        archivo: 'package.json',
        motivo: 'manifiesto: nombre, scripts y (tras instalar) dependencias',
        contenido: JSON.stringify(
          {
            name: '{{nombre}}',
            version: '1.0.0',
            private: true,
            main: 'server.js',
            scripts: {
              dev: 'node --watch --env-file=.env server.js',
              start: 'node --env-file=.env server.js',
              test: 'node --test'
            }
          },
          null,
          2
        ) + '\n'
      },
      {
        archivo: '.env.example',
        motivo: 'plantilla de variables de entorno (se versiona)',
        contenido: 'MONGO_URL=mongodb://localhost:27017/{{nombre}}\nPORT=3000\n'
      },
      {
        archivo: '.env',
        motivo: 'tus variables de entorno locales (no se versiona)',
        contenido: 'MONGO_URL=mongodb://localhost:27017/{{nombre}}\nPORT=3000\n'
      }
    ],
    gitignore: ['node_modules/', '.env'],
    instalar: {
      comando: 'npm install express mongoose',
      explicacion:
        'Descarga Express (el framework web) y Mongoose (la librería para hablar con MongoDB) en node_modules/ y los anota en package.json con la versión instalada. Se instalan por nombre para obtener la versión estable actual.'
    },
    ejecutar: {
      comando: 'npm run dev',
      explicacion:
        'Ejecuta el script "dev" de package.json: arranca server.js cargando las variables de .env, y lo reinicia solo cada vez que guardas un archivo (--watch).'
    },
    crearArchivosDelPlan: true,
    planBase: [
      { paso: 'Servidor base', archivo: 'server.js', concepto: 'servidor HTTP y middlewares' },
      { paso: 'Primer modelo', archivo: 'models/item.js', concepto: 'esquemas y validación' },
      { paso: 'Listar y crear', archivo: 'routes/items.js', concepto: 'rutas, req.body y códigos HTTP' },
      { paso: 'Manejo de errores', archivo: 'server.js', concepto: 'middleware de errores' }
    ]
  },
  {
    id: 'python-fastapi',
    nombre: 'Python + FastAPI + SQLite',
    para: 'APIs REST con Python',
    porQue: 'Python se lee casi como pseudocódigo, y FastAPI valida los datos con los tipos que escribes y genera la documentación de la API sola.',
    palabras: ['fastapi', 'sqlmodel', 'uvicorn'],
    stack: {
      resumen: 'Python + FastAPI + SQLite',
      lenguaje: 'Python 3.12+',
      framework: 'FastAPI',
      datos: 'SQLite con SQLModel',
      tests: 'pytest'
    },
    convenciones: [
      'entorno virtual en .venv',
      'la app se crea en app/main.py',
      'routers en app/routers/, incluidos con app.include_router',
      'modelos SQLModel en app/models.py',
      'tipos en todos los parámetros: FastAPI valida con ellos'
    ],
    base: [
      {
        archivo: 'requirements.txt',
        motivo: 'dependencias de Python',
        contenido: 'fastapi[standard]\nsqlmodel\npytest\n'
      },
      { archivo: 'app/__init__.py', motivo: 'convierte app/ en un paquete de Python', contenido: '' }
    ],
    gitignore: ['.venv/', '__pycache__/', '*.db', '.pytest_cache/'],
    instalar: {
      comando: 'python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt',
      windows: 'python -m venv .venv; .venv\\Scripts\\activate; pip install -r requirements.txt',
      explicacion:
        'Crea un entorno virtual (.venv): una carpeta con su propio Python, para que las librerías de este proyecto no se mezclen con otros. Lo activa y luego instala en él lo que lista requirements.txt.'
    },
    ejecutar: {
      comando: 'fastapi dev app/main.py',
      explicacion:
        'Arranca la API en modo desarrollo (se recarga al guardar). La documentación interactiva queda en http://localhost:8000/docs.'
    },
    crearArchivosDelPlan: true,
    planBase: [
      { paso: 'App base', archivo: 'app/main.py', concepto: 'rutas y decoradores' },
      { paso: 'Modelos', archivo: 'app/models.py', concepto: 'tipos y validación' },
      { paso: 'Base de datos', archivo: 'app/db.py', concepto: 'sesiones y SQLite' },
      { paso: 'Router del recurso', archivo: 'app/routers/items.py', concepto: 'CRUD y códigos HTTP' }
    ]
  },
  {
    id: 'react-vite',
    nombre: 'React 19 + Vite',
    para: 'Interfaces web interactivas (frontend)',
    porQue: 'React es el framework de interfaces más usado y Vite arranca al instante. Aprendes componentes, estado y props, que se repiten en cualquier framework moderno.',
    palabras: ['react', 'vite', 'jsx'],
    stack: {
      resumen: 'React 19 + Vite',
      lenguaje: 'JavaScript con JSX (ES modules)',
      framework: 'React 19',
      herramienta: 'Vite',
      tests: 'Vitest'
    },
    convenciones: [
      'ES modules (import/export)',
      'componentes en src/components/, uno por archivo, nombre en PascalCase',
      'estado con useState y efectos con useEffect; sin librerías extra al principio',
      'estilos en un archivo CSS por componente'
    ],
    base: [
      {
        archivo: 'package.json',
        motivo: 'manifiesto: scripts de Vite y (tras instalar) dependencias',
        contenido: JSON.stringify(
          {
            name: '{{nombre}}',
            private: true,
            version: '0.0.0',
            type: 'module',
            scripts: { dev: 'vite', build: 'vite build', preview: 'vite preview', test: 'vitest' }
          },
          null,
          2
        ) + '\n'
      }
    ],
    gitignore: ['node_modules/', 'dist/'],
    instalar: {
      comando: 'npm install react react-dom && npm install -D vite @vitejs/plugin-react vitest',
      explicacion:
        'Instala React (la librería de componentes) y, como dependencias de desarrollo (-D), Vite (el servidor que compila tu código al vuelo), su plugin de React y Vitest para los tests.'
    },
    ejecutar: {
      comando: 'npm run dev',
      explicacion: 'Arranca Vite: abre la URL que muestra (normalmente http://localhost:5173) y cada cambio se ve al instante.'
    },
    crearArchivosDelPlan: true,
    planBase: [
      { paso: 'Configurar Vite', archivo: 'vite.config.js', concepto: 'herramientas de build' },
      { paso: 'Página de entrada', archivo: 'index.html', concepto: 'punto de montaje' },
      { paso: 'Montar la app', archivo: 'src/main.jsx', concepto: 'createRoot y JSX' },
      { paso: 'Componente principal', archivo: 'src/App.jsx', concepto: 'componentes y props' },
      { paso: 'Primer componente con estado', archivo: 'src/components/Contador.jsx', concepto: 'useState' }
    ]
  },
  {
    id: 'django',
    nombre: 'Python + Django 5.2',
    para: 'Sitios web completos con panel de administración',
    porQue: 'Trae todo incluido (base de datos, usuarios, panel de admin) y una estructura clara. Ideal si el proyecto tiene muchas páginas y datos que administrar.',
    palabras: ['django'],
    stack: {
      resumen: 'Python + Django 5.2',
      lenguaje: 'Python 3.12+',
      framework: 'Django 5.2 (LTS)',
      datos: 'SQLite con el ORM de Django',
      tests: 'django.test'
    },
    convenciones: [
      'entorno virtual en .venv',
      'proyecto en config/, creado con django-admin startproject',
      'una app por área del sitio, creada con python manage.py startapp',
      'vistas basadas en funciones al principio; templates en <app>/templates/<app>/'
    ],
    base: [
      { archivo: 'requirements.txt', motivo: 'dependencias de Python', contenido: 'django>=5.2,<6\n' }
    ],
    gitignore: ['.venv/', '__pycache__/', 'db.sqlite3'],
    instalar: {
      comando:
        'python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt && django-admin startproject config .',
      windows:
        'python -m venv .venv; .venv\\Scripts\\activate; pip install -r requirements.txt; django-admin startproject config .',
      explicacion:
        'Crea y activa un entorno virtual, instala Django y ejecuta startproject, que genera la estructura del proyecto (config/ y manage.py). El punto final crea el proyecto en esta carpeta en vez de en una subcarpeta.'
    },
    ejecutar: {
      comando: 'python manage.py runserver',
      explicacion: 'Arranca el servidor de desarrollo en http://localhost:8000.'
    },
    crearArchivosDelPlan: false,
    nota:
      'Django genera su propia estructura con startproject y startapp. No creo los archivos del plan antes para no romper esos comandos: ejecuta primero el comando de instalación y luego abre cada paso desde el panel del plan.',
    planBase: [
      { paso: 'Primera app', archivo: 'tienda/views.py', concepto: 'vistas y URLs' },
      { paso: 'Modelos', archivo: 'tienda/models.py', concepto: 'ORM y migraciones' },
      { paso: 'Panel de admin', archivo: 'tienda/admin.py', concepto: 'registro de modelos' },
      { paso: 'Templates', archivo: 'tienda/templates/tienda/lista.html', concepto: 'plantillas y contexto' }
    ]
  }
];

export function getProfile(id: string | undefined): StackProfile | undefined {
  return id ? PROFILES.find((p) => p.id === id) : undefined;
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/**
 * Identifica el perfil que corresponde a lo que escribió el usuario ("quiero
 * usar Express con Mongo"). Devuelve undefined si no hay uno claro: mejor sin
 * perfil que con el equivocado.
 */
export function matchProfile(text: string | undefined): StackProfile | undefined {
  if (!text?.trim()) {
    return undefined;
  }
  const t = normalize(text);
  const scored = PROFILES.map((p) => ({
    p,
    score: p.palabras.filter((w) => new RegExp(`(^|[^a-z])${w}([^a-z]|$)`).test(t)).length
  }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);
  if (!scored.length || (scored[1] && scored[1].score === scored[0].score)) {
    return undefined;
  }
  return scored[0].p;
}

/** Nombre válido para package.json a partir de la carpeta del proyecto. */
export function packageName(folder: string): string {
  const name = normalize(folder)
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^[-._]+|[-._]+$/g, '');
  return name || 'mi-proyecto';
}
