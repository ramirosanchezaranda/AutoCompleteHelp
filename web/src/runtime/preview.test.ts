import { describe, expect, it } from 'vitest';
import { lessonCode } from '@core/lessons';
import { buildPreview, usesWebGPU } from './preview';

describe('vista previa con WebGPU', () => {
  it('reconoce los proyectos que dibujan con WebGPU', () => {
    expect([
      usesWebGPU({ 'src/main.ts': 'import { createShader } from "shaders/js";' }),
      usesWebGPU({ 'a.wgsl': '' }),
      usesWebGPU({ 'src/main.js': 'const a = await navigator.gpu.requestAdapter();' }),
      usesWebGPU({ 'src/main.js': 'import gsap from "gsap";' })
    ]).toEqual([true, true, true, false]);
  });

  it('la lección de Shaders lleva el diagnóstico de WebGPU; una sin WebGPU, no', async () => {
    const files = Object.fromEntries(['index.html', 'src/main.ts', 'src/escena.ts', 'src/halo.ts'].map((p) => [p, lessonCode('shaders-fondo-vivo', p)!.text]));
    const p = await buildPreview(files);
    expect([p.webgpu, p.html.includes("ach: 'gpu'"), p.errors]).toEqual([true, true, []]);
    const plain = await buildPreview({ 'index.html': '<!doctype html><p>hola</p>' });
    expect([plain.webgpu, plain.html.includes("ach: 'gpu'")]).toEqual([false, false]);
  });
});
