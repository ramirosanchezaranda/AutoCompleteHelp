# AutoCompleteHelp

Extensión para **VS Code, Cursor, Windsurf, VSCodium** y cualquier IDE basado en VS Code.

Autocompletado guiado por **tu prompt**: describes qué estás construyendo y la IA completa el código mientras escribes — pero con un objetivo distinto al de un copilot clásico: **que aprendas y entiendas cada parte de tu proyecto**, no que dependas de la IA.

## ✨ Características

- **Autocompletado inline** (texto fantasma) en cualquier lenguaje, aceptas con `Tab`.
- **Prompt del proyecto**: define qué estás construyendo y cómo quieres que te ayude; cada sugerencia usa ese contexto.
- **3 niveles de aprendizaje** (el corazón de la extensión):
  | Nivel | Qué hace | Para qué |
  |---|---|---|
  | `pista` | Solo comentarios con pasos y pistas — **tú escribes el código** | Máximo aprendizaje |
  | `guiado` *(por defecto)* | Código + comentarios que explican el **porqué** | Aprender mientras avanzas |
  | `completo` | Código directo | Máxima velocidad |
- **Explicar código seleccionado**: clic derecho → obtén una explicación pedagógica en español con una pregunta de comprensión.
- **Multi-LLM**: elige empresa y modelo desde la barra de estado:
  - Anthropic (Claude Opus 4.8, Sonnet 5, Sonnet 4.6, Haiku 4.5)
  - OpenAI (GPT-5.1, GPT-5, GPT-4.1…)
  - Google (Gemini 3 Pro, Gemini 2.5 Pro/Flash)
  - Mistral (Codestral, Mistral Large, Devstral)
  - DeepSeek, xAI (Grok), Groq
  - OpenRouter (acceso a cientos de modelos con una sola clave)
  - **Ollama** (modelos locales, gratis y sin API key)
  - Endpoint personalizado compatible con OpenAI
- **API keys seguras**: se guardan en el `SecretStorage` del IDE (keychain del sistema), nunca en settings.json.

## 🚀 Uso rápido

1. `npm install && npm run compile`
2. Abre la carpeta en VS Code y pulsa `F5` (Run Extension) — o empaqueta con `npx vsce package` e instala el `.vsix` en Cursor/VS Code (`Extensions → Install from VSIX`).
3. Paleta de comandos (`Ctrl/Cmd+Shift+P`):
   - **AutoCompleteHelp: Elegir proveedor y modelo** → elige LLM y guarda tu API key.
   - **AutoCompleteHelp: Definir prompt del proyecto** → ej. *"API REST en Express con MongoDB para una tienda; explícame cada middleware"*.
   - **AutoCompleteHelp: Elegir nivel de aprendizaje** → `pista`, `guiado` o `completo`.
4. Escribe código: las sugerencias aparecen como texto gris; `Tab` para aceptar.

## 🧱 Stack técnico

| Capa | Elección | Por qué |
|---|---|---|
| Lenguaje | **TypeScript** | Lenguaje oficial de la API de extensiones de VS Code |
| Integración IDE | **VS Code Extension API** (`InlineCompletionItemProvider`) | Una sola base de código funciona en VS Code, Cursor, Windsurf y VSCodium (todos son forks de VS Code) |
| Build | `tsc` (sin bundler) | Cero dependencias de runtime; empaquetado con `vsce` |
| LLMs | `fetch` nativo (Node 18+ del extension host) | Un cliente ligero neutral entre proveedores: Messages API (Anthropic), Chat Completions (OpenAI y compatibles), generateContent (Gemini) |
| Secretos | `context.secrets` (SecretStorage) | Claves cifradas por el sistema operativo |
| Estado | `workspaceState` | El prompt del proyecto se guarda por workspace |

### Arquitectura

```
src/
├── extension.ts            # activación, comandos, barra de estado
├── inlineProvider.ts       # InlineCompletionItemProvider (debounce, caché, cancelación)
├── prompts.ts              # prompts de sistema por nivel de aprendizaje + sanitizado
├── explain.ts              # panel "Explicar código seleccionado"
├── secrets.ts              # API keys en SecretStorage
└── providers/
    ├── catalog.ts          # catálogo de empresas/modelos y resolución de config
    └── client.ts           # cliente HTTP: anthropic | openai-compatible | gemini
```

## ⚙️ Configuración

| Setting | Default | Descripción |
|---|---|---|
| `autocompletehelp.provider` | `anthropic` | Proveedor de LLM |
| `autocompletehelp.model` | *(default del proveedor)* | ID del modelo |
| `autocompletehelp.learningLevel` | `guiado` | `pista` / `guiado` / `completo` |
| `autocompletehelp.maxTokens` | `400` | Tokens máximos por sugerencia |
| `autocompletehelp.debounceMs` | `350` | Espera tras dejar de teclear |
| `autocompletehelp.ollamaUrl` | `http://localhost:11434/v1` | URL de Ollama local |
| `autocompletehelp.customBaseUrl` | — | Endpoint OpenAI-compatible propio |

## 🗺️ Roadmap

- [ ] Streaming de sugerencias (mostrar el texto fantasma a medida que llega)
- [ ] FIM (fill-in-the-middle) nativo para Codestral/StarCoder
- [ ] Métricas de aprendizaje: cuántas sugerencias aceptas vs. escribes tras una pista
- [ ] Quiz automático al final de una sesión de código
- [ ] Publicación en VS Code Marketplace y Open VSX

## Licencia

MIT
