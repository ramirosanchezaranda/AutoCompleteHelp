# Changelog

Todos los cambios notables de AutoCompleteHelp se documentan aquí.

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
