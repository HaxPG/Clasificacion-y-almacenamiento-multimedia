// src/app/features/dashboard/components/file-list/file-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { BehaviorSubject, Observable, of, switchMap, tap, catchError } from 'rxjs';

import { FileService } from '../../../../core/services/file';
import { File as AppFile } from '../../../../shared/models/file';
import { environment } from '../../../../../environments/environment';

// Interfaces para tipar correctamente la respuesta del backend
interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface PaginatedFilesResponse {
  archivos: AppFile[];
  pagination: PaginationInfo;
}

@Component({
  selector: 'app-file-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule
  ],
  templateUrl: './file-list.html',
  styleUrls: ['./file-list.css']
})
export class FileListComponent implements OnInit {
  archivos$: Observable<PaginatedFilesResponse> = new Observable();
  error: string | null = null;
  isLoading: boolean = false;

  private limit: number = 20;
  private pageSubject = new BehaviorSubject<number>(1);

  // Filtros
  tagTerm: string = '';
  selectedTipo: string = '';
  selectedCategory: number | null = null;
  selectedAccessLevel: string = '';
  categories: any[] = [];

  userRole: string = 'Usuario'; // Idealmente vendría desde el AuthService

  archivoSeleccionado: AppFile | null = null;

  constructor(private fileService: FileService) {}

  /**
   * Inicializa el observable principal para cargar archivos paginados
   * según los filtros seleccionados.
   */
  ngOnInit(): void {
    this.archivos$ = this.pageSubject.pipe(
      tap(() => {
        this.error = null;
        this.isLoading = true;
      }),
      switchMap(page =>
        this.fileService.getFiles(
          page,
          this.limit,
          this.selectedTipo || undefined,
          this.selectedCategory || undefined,
          this.tagTerm.trim() || undefined,
          this.selectedAccessLevel || undefined
        ).pipe(
          tap(() => this.isLoading = false),
          catchError(err => {
            this.isLoading = false;
            this.error = `Error al cargar los archivos: ${err.statusText || err.message || 'Error desconocido'}`;
            return of({
              archivos: [],
              pagination: { page: 1, limit: this.limit, total: 0, pages: 0 }
            });
          })
        )
      )
    );
  }

  /** Cambia la página actual */
  goToPage(page: number): void {
    this.pageSubject.next(page);
  }

  /** Se ejecuta cuando cambian los filtros select (tipo o acceso) */
  onFilterChange(): void {
    this.pageSubject.next(1);
  }

  /** Se ejecuta al escribir en la búsqueda por etiquetas */
  onSearch(): void {
    this.pageSubject.next(1);
  }

  /** Reinicia todos los filtros y vuelve a la primera página */
  resetFilters(): void {
    this.tagTerm = '';
    this.selectedTipo = '';
    this.selectedCategory = null;
    this.selectedAccessLevel = '';
    this.pageSubject.next(1);
  }

  /**
   * Construye la URL completa del archivo desde su ruta relativa.
   * @param ruta Ruta relativa desde el backend (e.g. "uploads/image.jpg")
   */
  getFileUrl(ruta: string): string {
    return `${environment.apiUrl}/uploads/${ruta.split('/').pop()}`;
  }

  /** Muestra el modal con información detallada del archivo */
  mostrarDetalle(archivo: AppFile): void {
    this.archivoSeleccionado = archivo;
  }

  /** Cierra el modal de detalle */
  cerrarModal(): void {
    this.archivoSeleccionado = null;
  }

  /**
   * Descarga un archivo y registra la descarga en el backend.
   * @param archivo Archivo a descargar
   */
  descargarArchivo(archivo: AppFile): void {
    this.fileService.registrarDescarga(archivo.id_archivo).subscribe({
      next: () => {
        // Incrementar el contador local
        if (archivo.downloads !== undefined && archivo.downloads !== null) {
          archivo.downloads++;
        } else {
          archivo.downloads = 1;
        }

        const downloadUrl = `${environment.apiUrl}/descargar/${archivo.id_archivo}`;
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = archivo.nombre_archivo || 'archivo';
        a.target = '_blank';
        a.click();
      },
      error: err => {
        console.error("❌ Error registrando descarga o al intentar descargar:", err);
        this.error = 'Error al intentar descargar el archivo.';
      }
    });
  }

  /**
   * Genera un array de números de página para paginación visible
   * @param currentPage Página actual
   * @param totalPages Número total de páginas
   */
  getPagesArray(currentPage: number, totalPages: number): number[] {
    const pages = [];
    const maxPagesToShow = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }
}
