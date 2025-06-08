import { File } from './file'; // Import File interface

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