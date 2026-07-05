import { api } from './api';

export interface Categoria {
  id: string;
  nombre: string;
}

// Todos los rubros disponibles.
export function getAllCategorias(): Promise<Categoria[]> {
  return api.get<Categoria[]>('/api/categorias');
}

// Rubros del corralón autenticado.
export function getMyCategorias(): Promise<Categoria[]> {
  return api.get<Categoria[]>('/api/users/me/categorias');
}

// Reemplaza el conjunto de rubros del corralón (relación N↔N).
export function setMyCategorias(categoriaIds: string[]): Promise<Categoria[]> {
  return api.put<Categoria[]>('/api/users/me/categorias', { categoriaIds });
}
