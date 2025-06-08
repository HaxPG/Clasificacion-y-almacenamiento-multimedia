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
  id_categoria?: number;
  categoria_nombre?: string; // JOIN en el backend
  usuario_nombre?: string; // JOIN en el backend
  tags?: string;
  colecciones?: string;
  secciones?: string;

  // 👇 NUEVA PROPIEDAD para visualizaciones
  views?: number;
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
