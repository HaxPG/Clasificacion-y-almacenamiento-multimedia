// src/app/features/dashboard/components/file-list/file-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { BehaviorSubject, Observable, of, switchMap, tap, catchError } from 'rxjs';

import { FileService } from '../../../../core/services/file';
import { File as AppFile } from '../../../../shared/models/file'; // Asumiendo que AppFile ya tiene titulo_archivo
import { environment } from '../../../../../environments/environment';

// Definir interfaces para la respuesta del backend
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
  // CAMBIO AQUÍ: El Observable ahora espera la estructura completa de paginación
  archivos$: Observable<PaginatedFilesResponse> = new Observable();
  error: string | null = null;
  isLoading: boolean = false;

  private limit: number = 20; // Ajusta el límite por defecto, 1000 es mucho para una página
  private pageSubject = new BehaviorSubject<number>(1);

  tagTerm: string = '';
  selectedTipo: string = '';
  selectedCategory: number | null = null;
  selectedAccessLevel: string = '';
  categories: any[] = []; // Considera definir una interfaz para Category
  userRole: string = 'Usuario'; // Esto debería venir de tu servicio de autenticación

  archivoSeleccionado: AppFile | null = null;

  constructor(private fileService: FileService) {}

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
          // CAMBIO AQUÍ: Asegurarse de que el valor por defecto en caso de error coincida con la interfaz
          catchError(err => {
            this.isLoading = false;
            this.error = `Error al cargar los archivos: ${err.statusText || err.message || 'Error desconocido'}`;
            // Devolver un objeto que cumpla con la interfaz PaginatedFilesResponse
            return of({
              archivos: [],
              pagination: { page: 1, limit: this.limit, total: 0, pages: 0 }
            });
          })
        )
      )
    );
  }

  // CAMBIO AQUÍ: `goToPage` se mantiene igual, ya que solo cambia el `pageSubject`
  goToPage(page: number): void {
    this.pageSubject.next(page);
  }

  onFilterChange(): void {
    this.pageSubject.next(1);
  }

  onSearch(): void {
    this.pageSubject.next(1);
  }

  resetFilters(): void {
    this.tagTerm = '';
    this.selectedTipo = '';
    this.selectedCategory = null;
    this.selectedAccessLevel = '';
    this.pageSubject.next(1); // Reiniciar a la primera página
  }

  getFileUrl(ruta: string): string {
    // Asegúrate de que environment.apiUrl está configurado correctamente (ej. http://localhost:3000/api)
    // Y que el backend sirve los archivos estáticos desde /api/uploads
    return `${environment.apiUrl}/uploads/${ruta.split('/').pop()}`; // Extrae solo el nombre del archivo para la URL
  }


  mostrarDetalle(archivo: AppFile): void {
    this.archivoSeleccionado = archivo;
  }

  cerrarModal(): void {
    this.archivoSeleccionado = null;
  }

  descargarArchivo(archivo: AppFile): void {
    // CAMBIO AQUÍ: La ruta de descarga en el backend ahora es /api/descargar/:id
    this.fileService.registrarDescarga(archivo.id_archivo).subscribe({
      next: () => {
        // Incrementa el contador de descargas solo si no es undefined
        if (archivo.downloads !== undefined && archivo.downloads !== null) {
          archivo.downloads++;
        } else {
          archivo.downloads = 1; // Si es la primera descarga, inicialízalo en 1
        }

        // Usar la ruta de descarga directa del backend, que ahora maneja el conteo
        const downloadUrl = `${environment.apiUrl}/descargar/${archivo.id_archivo}`;
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = archivo.nombre_archivo || 'archivo'; // Sugiere el nombre de archivo original
        a.target = '_blank';
        a.click();
      },
      error: err => {
        console.error("❌ Error registrando descarga o al intentar descargar:", err);
        // Opcional: Mostrar un mensaje de error al usuario
        this.error = 'Error al intentar descargar el archivo.';
      }
    });
  }

  // NUEVA FUNCIÓN: Para generar el array de números de página
  getPagesArray(currentPage: number, totalPages: number): number[] {
    const pages = [];
    const maxPagesToShow = 5; // Número máximo de botones de página a mostrar

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