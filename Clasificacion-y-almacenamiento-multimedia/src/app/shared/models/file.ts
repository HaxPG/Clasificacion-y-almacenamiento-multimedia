// src/app/shared/models/file.ts

export interface File {
  id_archivo: number;
  nombre_archivo: string; // Nombre original del archivo
  tipo: string;
  ruta_storage: string; // Ruta relativa al directorio de subidas (ej. 'uploads/imagen-123.png')
  miniaturta?: string; // Si tu backend genera miniaturas
  fecha_subida: string; // ISO 8601 string
  fuente?: string;
  lugar_captura?: string;
  fecha_captura?: string; // ISO 8601 string o Date string
  derechos_uso?: string;
  nivel_acceso: 'público' | 'restringido' | 'privado';
  id_usuario: number;
  id_categoria?: number; // Opcional, si no todos los archivos tienen categoría
  categoria_nombre?: string; // Propiedad añadida por el JOIN en el backend
  usuario_nombre?: string; // Propiedad añadida por el JOIN en el backend
  tags?: string; // Puede ser una cadena de tags separados por comas si usas GROUP_CONCAT
  colecciones?: string; // Igual para colecciones
  secciones?: string; // Igual para secciones
}

export interface Pagination {
  page: number;
  limit: number;
  total: number; // Total de archivos en la base de datos
  pages: number; // Total de páginas
}

export interface PaginatedFiles {
  archivos: File[];
  pagination: Pagination;
}