// src/app/shared/models/file.ts

export interface File {
  id_archivo: number;
  nombre_archivo: string; // Nombre original del archivo
  titulo_archivo?: string; // <--- AÑADE ESTA LÍNEA
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
  id_categoria?: number;
  categoria_nombre?: string; // JOIN en el backend
  usuario_nombre?: string; // JOIN en el backend
  tags?: string; // Nota: Si tu backend devuelve un array de strings, esto debería ser `string[]`
  colecciones?: string; // Nota: Si tu backend devuelve un array de IDs, esto debería ser `number[]`
  secciones?: string; // Nota: Si tu backend devuelve un array de IDs, esto debería ser `number[]`
  downloads?: number;
  views?: number; // Propiedad para visualizaciones
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PaginatedFiles {
  archivos: File[];
  pagination: Pagination;
}