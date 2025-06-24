// src/app/shared/models/file.ts

export interface File {
  id_archivo: number;
  nombre_archivo: string;
  titulo_archivo?: string;
  tipo: string;
  ruta_storage: string;
  miniaturta?: string;
  fecha_subida: string;
  fuente?: string;
  lugar_captura?: string;
  fecha_captura?: string;
  derechos_uso?: string;
  nivel_acceso: 'público' | 'restringido' | 'privado';
  id_usuario: number;
  id_categoria?: number;
  categoria_nombre?: string;
  usuario_nombre?: string;
  tags?: string;
  colecciones?: string;
  secciones?: string;
  downloads?: number;
  views?: number;
} // Representa un archivo subido con metadatos opcionales, relaciones y estadísticas

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
} // Estructura para manejar datos de paginación

export interface PaginatedFiles {
  archivos: File[];
  pagination: Pagination;
} // Agrupa archivos paginados junto a su información de navegación
