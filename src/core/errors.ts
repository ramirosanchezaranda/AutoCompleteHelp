/** Prompts para entender un error (puros, compartidos con la web app). */

export function buildErrorSystemPrompt(projectBlock: string): string {
  const out = [
    'Eres un mentor de programación. El alumno tiene un error (o aviso) del editor en su código y quiere ENTENDERLO.',
    'Responde en español, en Markdown, con esta estructura:',
    '## Qué dice — el mensaje traducido a palabras simples; define cada término técnico la primera vez.',
    '## Por qué pasa aquí — la causa concreta en SU código, señalando la línea marcada con ">>". No hables en abstracto.',
    '## Cómo encontrarlo tú — los pasos para llegar a la solución (qué mirar, qué comprobar).',
    '## Para la próxima — cómo reconocer este tipo de error la próxima vez que aparezca, en una o dos frases.',
    'NO escribas el código corregido ni la línea arreglada: el alumno debe corregirlo él mismo.',
    'Puedes nombrar funciones, palabras clave o la parte exacta que falla, pero no la solución escrita.',
    'Si hay una confusión de concepto detrás (no solo un descuido), nómbrala.'
  ];
  if (projectBlock) {
    out.push('Contexto del proyecto (usa su stack, versiones y arquitectura al explicar):', projectBlock);
  }
  return out.join('\n');
}

export function buildErrorUserPrompt(
  languageId: string,
  file: string,
  message: string,
  source: string,
  firstLine: number,
  lines: string[],
  errStart: number,
  errEnd: number
): string {
  const width = String(firstLine + lines.length).length;
  const code = lines
    .map((l, i) => {
      const n = firstLine + i;
      const mark = n >= errStart && n <= errEnd ? '>>' : '  ';
      return `${mark} ${String(n + 1).padStart(width)} | ${l}`;
    })
    .join('\n');
  return [
    `Lenguaje: ${languageId}`,
    `Archivo: ${file}`,
    `Error${source ? ` (${source})` : ''}: ${message}`,
    'Código (la línea del error está marcada con >>):',
    code
  ].join('\n');
}
