/** Almacenamiento local (IndexedDB): proyectos, progreso y claves cifradas. Nada sale del dispositivo. */
import { createStore, del, get, keys, set } from 'idb-keyval';

const store = createStore('autocompletehelp', 'datos');

export const db = {
  get: <T>(key: string) => get<T>(key, store),
  set: (key: string, value: unknown) => set(key, value, store),
  del: (key: string) => del(key, store),
  keys: async (prefix: string) => ((await keys(store)) as string[]).filter((k) => typeof k === 'string' && k.startsWith(prefix))
};
