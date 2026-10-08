/** «Empezar»: los tres caminos (puro, compartido con la web app). */

export type StartKind = 'project' | 'learn' | 'recommend';

/** Las tres cajas: qué se escribe en cada una y ejemplos para tocar. */
export const START_BOXES: { kind: StartKind; tab: string; titulo: string; ayuda: string; placeholder: string; boton: string; ejemplos: string[] }[] = [
  {
    kind: 'project',
    tab: '🚀 Proyecto',
    titulo: '🚀 Tengo un proyecto',
    ayuda: 'Qué construyes + cómo quieres que te expliquen.',
    placeholder: 'Ej: e-commerce completa, explica cada código que agregues y por qué elegiste esa metodología',
    boton: 'Elegir stack y arquitectura →',
    ejemplos: ['una app para reservar canchas con mis amigos', 'una API de tareas, explica cada capa']
  },
  {
    kind: 'learn',
    tab: '🎓 Aprender',
    titulo: '🎓 Quiero aprender',
    ayuda: 'Un lenguaje, una librería, la nube, patrones, IA… lo que sea.',
    placeholder: 'Ej: TypeScript, three.js, patrones de API, configurar AWS',
    boton: 'Ver proyectos para aprenderlo →',
    ejemplos: ['TypeScript', 'arquitectura hexagonal', 'patrones de API', 'entrenar una IA']
  },
  {
    kind: 'recommend',
    tab: '💡 Ideas',
    titulo: '💡 Recomiéndame un proyecto',
    ayuda: 'Recomiéndame un proyecto: qué te interesa o para qué quieres aprender.',
    placeholder: 'Ej: quiero trabajar de backend, me gustan los videojuegos',
    boton: 'Recomiéndame →',
    ejemplos: ['quiero trabajar en la nube', 'automatizar mi trabajo con Excel']
  }
];

