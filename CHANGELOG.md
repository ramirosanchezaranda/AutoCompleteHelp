# Changelog

Todos los cambios notables de AutoCompleteHelp se documentan aquí.

## [0.2.0] — 2026-07-22

### Añadido

- **Streaming de sugerencias (SSE)** para Anthropic, Gemini y APIs
  OpenAI-compatibles, con corte temprano y progreso en la barra de estado
  (`autocompletehelp.streaming`).
- **Guía del proyecto basada en el prompt**: los archivos vacíos reciben su
  esqueleto inicial según su ruta y el prompt, y cada sugerencia termina con
  un comentario «➜ Siguiente paso» (`autocompletehelp.projectGuidance`).
- **Nivel «edúcame»**: para empezar desde cero — cada línea explicada con
  conceptos básicos, una idea nueva por sugerencia.
- **Comando «Recomendar stack para mi proyecto»**: el LLM propone el stack más
  adecuado para aprender (con alternativas, estructura inicial y ruta de
  aprendizaje) y permite fijarlo en el prompt del proyecto.
- Aviso único para definir el prompt del proyecto si aún no existe.

## [0.1.0] — 2026-07-22

### Añadido

- Autocompletado inline multi-lenguaje mediante `InlineCompletionItemProvider`
  (compatible con VS Code, Cursor, Windsurf y VSCodium).
- Prompt del proyecto por workspace: el usuario describe qué construye y cómo
  quiere que le ayude la IA.
- Tres niveles de aprendizaje: `pista` (solo comentarios-guía, el usuario
  escribe el código), `guiado` (código con comentarios que explican el porqué)
  y `completo` (código directo).
- Comando "Explicar código seleccionado" con panel pedagógico en español.
- Soporte multi-proveedor: Anthropic (Claude), OpenAI, Google Gemini, Mistral,
  DeepSeek, xAI (Grok), Groq, OpenRouter, Ollama local y endpoints
  OpenAI-compatibles personalizados.
- Selección de proveedor/modelo desde la barra de estado, con opción de
  escribir cualquier ID de modelo.
- API keys almacenadas en el `SecretStorage` del IDE.
- Debounce, cancelación de peticiones y caché de la última sugerencia.
