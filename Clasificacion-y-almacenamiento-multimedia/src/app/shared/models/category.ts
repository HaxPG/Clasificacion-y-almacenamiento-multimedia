export interface Category {
  id_categoria: number;
  nombre: string;
  id_padre?: number;
  nombre_padre?: string;
} // Representa una categoría con posible jerarquía (padre e hijo)
