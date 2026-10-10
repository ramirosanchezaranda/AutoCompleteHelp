import { describe, expect, it } from 'vitest';
import { lessonCode } from '@core/lessons';
import { back, dictateLine, feed, isDone, lastSummary, startSession, viewOf } from './session';

const start = (path: string) => {
  const code = lessonCode('typescript-gastos', path)!;
  return startSession({ path, instruction: 'x', text: code.text, concepts: code.concepts, insertAt: 0 });
};

/** Escribe todo lo que falta, carácter por carácter. */
function typeAll(s: ReturnType<typeof start>) {
  let guard = 0;
  while (!isDone(s) && guard++ < 100000) s = feed(s, s.text[s.pos]);
  return s;
}

describe('Completamos juntos (web)', () => {
  it('los comentarios también se escriben: empieza en el primer comentario', () => {
    const s = start('src/gasto.ts');
    expect(s.text.slice(s.pos, s.pos + 6)).toBe('// Cóm');
    const solo = startSession({ path: 'src/gasto.ts', instruction: 'x', text: s.text, concepts: [], insertAt: 0, typeComments: false });
    expect(solo.text.slice(solo.pos, solo.pos + 6)).toBe('export');
    // Solo se muestra la línea actual (con sus comentarios), no el resto.
    expect(s.text.slice(0, s.shown)).not.toContain('interface Gasto');
  });

  it('un error no avanza y dice qué esperaba', () => {
    let s = start('src/gasto.ts');
    const pos = s.pos;
    s = feed(s, 'X');
    expect(s.pos).toBe(pos);
    expect(s.errors).toBe(1);
    expect(viewOf(s).hint).toBe('esperaba «/»');
  });

  it('acentos tolerantes: «e» vale por «é»', () => {
    const s = startSession({ path: 'notas/a.md', instruction: 'x', text: 'Qué', concepts: [], insertAt: 0 });
    expect(isDone(feed(feed(feed(s, 'Q'), 'u'), 'e'))).toBe(true);
  });

  it('JSON: los comentarios se escriben y cada línea tiene el suyo', () => {
    const code = lessonCode('typescript-gastos', 'package.json')!;
    const s = startSession({ path: 'package.json', instruction: 'x', text: code.text, concepts: [], insertAt: 0 });
    expect(s.text.slice(s.pos, s.pos + 2)).toBe('//');
    expect(typeAll(s).errors).toBe(0);
  });

  it('Enter muestra la línea siguiente y el ↑ aparece al cerrar el bloque', () => {
    let s = start('src/gasto.ts');
    s = typeAll(s);
    expect(s.errors).toBe(0);
    expect(lastSummary(s)).toContain('Gasto: la forma de cada gasto');
  });

  it('retroceso vuelve un carácter; díctame la línea cuenta como ayuda', () => {
    let s = start('src/gasto.ts');
    const p0 = s.pos;
    s = feed(s, 'e');
    s = back(s);
    expect(s.pos).toBe(p0);
    s = dictateLine(s);
    expect(s.helped).toBe(1);
    expect(s.text[s.pos - 1]).not.toBe('e');
  });

  it('teoría: las explicaciones > también se escriben, antes del título', () => {
    const code = lessonCode('typescript-gastos', 'notas/01-tipos.md')!;
    const s = startSession({ path: 'notas/01-tipos.md', instruction: 'x', text: code.text, concepts: [], insertAt: 0 });
    expect(s.text.slice(s.pos).startsWith('>')).toBe(true);
    expect(s.text.slice(s.pos, s.text.indexOf('## Tipos en TypeScript'))).not.toContain('\n\n');
  });
});
