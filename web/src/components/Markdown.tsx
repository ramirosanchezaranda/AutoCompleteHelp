import { useMemo } from 'react';
import { Marked } from 'marked';

/** Markdown seguro: el HTML crudo (por ejemplo, de una respuesta de la IA) se muestra como texto. */
const md = new Marked({
  gfm: true,
  breaks: false,
  renderer: {
    html(token) {
      return escapeHtml(token.text);
    }
  }
});

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
}

export function Markdown({ text, className = '' }: { text: string; className?: string }) {
  const html = useMemo(() => {
    const out = md.parse(text, { async: false }) as string;
    // Sin enlaces javascript: ni atributos on*.
    return out.replace(/href="javascript:[^"]*"/gi, 'href="#"').replace(/\son\w+="[^"]*"/gi, '');
  }, [text]);
  return <div className={`md ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}
