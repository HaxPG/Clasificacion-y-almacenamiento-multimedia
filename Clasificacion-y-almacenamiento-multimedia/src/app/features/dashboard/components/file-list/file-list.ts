// src/app/features/dashboard/components/file-list/file-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { BehaviorSubject, Observable, of, switchMap, tap, catchError } from 'rxjs';

import { FileService } from '../../../../core/services/file'; // Asegúrate que la ruta sea correcta
import { File as AppFile } from '../../../../shared/models/file'; // Asegúrate que la ruta sea correcta y el modelo sea correcto
import { environment } from '../../../../../environments/environment'; // Asegúrate que la ruta sea correcta

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
  categories: any[] = []; // Idealmente tipar esto con una interfaz de Categoria

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
            console.error("Error al cargar archivos:", err); // Log del error completo
            this.error = `Error al cargar los archivos: ${err.message || 'Error desconocido'}. Código: ${err.status || ''}`;
            return of({
              archivos: [],
              pagination: { page: 1, limit: this.limit, total: 0, pages: 0 }
            });
          })
        )
      )
    );
    // Posiblemente cargar categorías aquí:
    // this.loadCategories();
  }

  // loadCategories() {
  //   this.fileService.getCategories().subscribe({ // Asume que tienes un método getCategories en tu FileService
  //     next: (data) => this.categories = data,
  //     error: (err) => console.error("Error loading categories", err)
  //   });
  // }

  /** Cambia la página actual */
  goToPage(page: number): void {
    this.pageSubject.next(page);
  }

  /** Se ejecuta cuando cambian los filtros select (tipo o acceso) */
  onFilterChange(): void {
    this.pageSubject.next(1); // Volver a la primera página con los nuevos filtros
  }

  /** Se ejecuta al escribir en la búsqueda por etiquetas */
  onSearch(): void {
    this.pageSubject.next(1); // Volver a la primera página con el nuevo término de búsqueda
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
   * Construye la URL completa del archivo para visualización (no descarga).
   * Útil para mostrar miniaturas o previas si el archivo es directamente accesible.
   * @param ruta Ruta relativa desde el backend (e.g. "uploads/image.jpg")
   */
  getFileUrl(ruta: string): string {
    // CORRECCIÓN AQUÍ: Quitar '/api' ya que environment.apiUrl ya lo incluye.
    // El servidor Node.js sirve los archivos estáticos en `http://localhost:3000/api/uploads/`
    const fileName = ruta.split('/').pop();
    return `${environment.apiUrl.replace('/api', '')}/api/uploads/${fileName}`;
    // Alternativa si environment.apiUrl SIEMPRE es 'http://localhost:3000/api':
    // return `http://localhost:3000/api/uploads/${fileName}`;
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
   * Descarga un archivo.
   * Esta función ahora llama directamente a la ruta GET /api/descargar/:id
   * que ya incrementa el contador en el backend y fuerza la descarga.
   * @param archivo Archivo a descargar
   */
  descargarArchivo(archivo: AppFile): void {
    if (!archivo || !archivo.id_archivo) {
      this.error = 'Error: No se puede descargar un archivo inválido.';
      return;
    }

    this.fileService.downloadFile(archivo.id_archivo).subscribe({
      next: (blob) => {
        // Crear una URL temporal para el Blob recibido
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = archivo.nombre_archivo || `descarga_${archivo.id_archivo}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);

        console.log(`✅ Archivo '${archivo.nombre_archivo}' (ID: ${archivo.id_archivo}) descargado.`);

        if (archivo.downloads !== undefined && archivo.downloads !== null) {
          archivo.downloads++;
        } else {
          archivo.downloads = 1;
        }
      },
      error: err => {
        console.error("❌ Error al descargar el archivo:", err);
        let errorMessage = 'Error al intentar descargar el archivo.';
        if (err.status === 401 || err.status === 403) {
          errorMessage = 'No tienes permisos para descargar este archivo o tu sesión ha expirado.';
        } else if (err.status === 404) {
          errorMessage = 'El archivo solicitado no fue encontrado en el servidor.';
        } else if (err.error && typeof err.error === 'object' && err.error.error) {
          errorMessage = err.error.error;
        } else if (err.message) {
          errorMessage = err.message;
        }
        this.error = errorMessage;
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
