// src/app/features/dashboard/components/file-list/file-list.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Necesario para *ngFor, *ngIf, async pipe, ngSwitch, etc.
import { FormsModule } from '@angular/forms'; // Necesario si planeas añadir filtros con ngModel
import { HttpClientModule } from '@angular/common/http'; // Asegúrate de importar HttpClientModule si no está en AppModule

import { Observable, BehaviorSubject, switchMap, catchError, of, tap } from 'rxjs';
import { FileService } from '../../../../core/services/file'; // Asegúrate que FileService esté en esta ruta
import { File as AppFile, PaginatedFiles, Pagination } from '../../../../shared/models/file'; // 'File' renombrado a 'AppFile' para evitar colisión de nombres
import { environment } from '../../../../../environments/environment'; // Asegúrate que esta ruta sea correcta

// Si usas íconos de Font Awesome, asegúrate de tenerlos instalados y configurados en tu proyecto.
// npm install @fortawesome/fontawesome-free
// Y en angular.json, añade: "node_modules/@fortawesome/fontawesome-free/css/all.min.css" en la sección "styles"

@Component({
  selector: 'app-file-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule // Necesario para que HttpClient funcione en un componente standalone si no se importa globalmente
  ],
  template: `
    <div class="file-list-container">
      <h2>Lista de Archivos Multimedia</h2>

      <div class="filters-section">
        <div class="search-bar">
          <input
            type="text"
            [(ngModel)]="searchTerm"
            placeholder="Buscar por nombre, fuente, lugar..."
            (keyup.enter)="onSearch()"
          />
          <button (click)="onSearch()">Buscar</button>
        </div>

        <div class="filter-controls">
          <div class="filter-group">
            <label for="filterTipo">Tipo:</label>
            <select id="filterTipo" [(ngModel)]="selectedTipo" (change)="onFilterChange()">
              <option value="">Todos</option>
              <option value="imagen">Imagen</option>
              <option value="video">Video</option>
              <option value="audio">Audio</option>
              <option value="documento">Documento</option>
            </select>
          </div>

          <div class="filter-group">
            <label for="filterCategory">Categoría:</label>
            <select id="filterCategory" [(ngModel)]="selectedCategory" (change)="onFilterChange()">
              <option [ngValue]="null">Todas</option>
              <option [ngValue]="1">Naturaleza</option>
              <option [ngValue]="2">Ciudades</option>
              <option [ngValue]="3">Personas</option>
            </select>
          </div>

          <div class="filter-group" *ngIf="userRole === 'Administrador' || userRole === 'Editor'">
            <label for="filterAccess">Acceso:</label>
            <select id="filterAccess" [(ngModel)]="selectedAccessLevel" (change)="onFilterChange()">
              <option value="">Todos</option>
              <option value="publico">Público</option>
              <option value="restringido">Restringido</option>
              <option value="privado">Privado</option>
            </select>
          </div>
          <button (click)="resetFilters()">Limpiar Filtros</button>
        </div>
      </div>
      <div *ngIf="paginatedFiles$ | async as data; else loadingOrError">
        <div *ngIf="data.archivos && data.archivos.length > 0; else noFiles">
          <div class="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Miniatura/Preview</th>
                  <th>Nombre</th>
                  <th>Tipo</th>
                  <th>Categoría</th>
                  <th>Acceso</th>
                  <th>Fuente</th>
                  <th>Fecha Subida</th>
                  <th>Usuario</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let archivo of data.archivos">
                  <td>
                    <ng-container [ngSwitch]="archivo.tipo">
                      <img *ngSwitchCase="'imagen'" [src]="getFileUrl(archivo.ruta_storage)" alt="Preview" class="file-thumbnail" />
                      <video *ngSwitchCase="'video'" [src]="getFileUrl(archivo.ruta_storage)" controls class="file-thumbnail"></video>
                      <audio *ngSwitchCase="'audio'" [src]="getFileUrl(archivo.ruta_storage)" controls class="file-thumbnail"></audio>
                      <span *ngSwitchCase="'documento'" class="file-icon"><i class="fas fa-file-alt"></i></span>
                      <span *ngSwitchDefault class="file-icon"><i class="fas fa-file"></i></span>
                    </ng-container>
                  </td>
                  <td>{{ archivo.nombre_archivo }}</td>
                  <td>{{ archivo.tipo }}</td>
                  <td>{{ archivo.categoria_nombre || 'N/A' }}</td>
                  <td>{{ archivo.nivel_acceso }}</td>
                  <td>{{ archivo.fuente || 'N/A' }}</td>
                  <td>{{ archivo.fecha_subida | date:'short' }}</td>
                  <td>{{ archivo.usuario_nombre || 'N/A' }}</td>
                  <td>
                    <a [href]="getFileUrl(archivo.ruta_storage)" target="_blank" class="action-btn view-btn" title="Ver archivo">
                      <i class="fas fa-eye"></i>
                    </a>
                    </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="pagination-controls" *ngIf="data.pagination as pagination">
            <button (click)="goToPage(1)" [disabled]="pagination.page === 1" title="Primera página">
              <i class="fas fa-angle-double-left"></i>
            </button>
            <button (click)="goToPage(pagination.page - 1)" [disabled]="pagination.page === 1" title="Página anterior">
              <i class="fas fa-angle-left"></i>
            </button>

            <span *ngFor="let page of getPagesArray(pagination.page, pagination.pages)">
              <button (click)="goToPage(page)" [class.active]="page === pagination.page">{{ page }}</button>
            </span>

            <button (click)="goToPage(pagination.page + 1)" [disabled]="pagination.page === pagination.pages" title="Página siguiente">
              <i class="fas fa-angle-right"></i>
            </button>
            <button (click)="goToPage(pagination.pages)" [disabled]="pagination.page === pagination.pages" title="Última página">
              <i class="fas fa-angle-double-right"></i>
            </button>
            <span class="page-info">Página {{ pagination.page }} de {{ pagination.pages }} (Total: {{ pagination.total }} archivos)</span>
          </div>
        </div>
        <ng-template #noFiles>
          <div class="no-files-message">No se encontraron archivos con los criterios de búsqueda o filtro.</div>
        </ng-template>
      </div>
      <ng-template #loadingOrError>
        <div *ngIf="error; else loading" class="error-message">
          <p>{{ error }}</p>
        </div>
        <ng-template #loading>
          <div class="loading-spinner">Cargando archivos...</div>
        </ng-template>
      </ng-template>
    </div>
  `,
  styles: [`
    .file-list-container {
      padding: 20px;
      max-width: 1200px;
      margin: 20px auto;
      background-color: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    h2 {
      color: #333;
      margin-bottom: 20px;
      text-align: center;
    }

    .filters-section {
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
      margin-bottom: 20px;
      padding: 15px;
      background-color: #f9f9f9;
      border-radius: 8px;
      border: 1px solid #eee;
      align-items: center;
    }

    .search-bar {
      flex-grow: 1;
      display: flex;
      gap: 10px;
    }

    .search-bar input {
      flex-grow: 1;
      padding: 8px 12px;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 0.9em;
    }

    .filter-controls {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
    }

    .filter-group {
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .filters-section button,
    .filter-group select {
      padding: 8px 12px;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 0.9em;
      background-color: #f2f2f2;
    }
    .filters-section button {
      background-color: #007bff;
      color: white;
      cursor: pointer;
      border: none;
    }
    .filters-section button:hover {
      background-color: #0056b3;
    }

    .table-responsive {
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }

    table th, table td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
      vertical-align: middle;
    }

    table th {
      background-color: #f2f2f2;
      font-weight: bold;
      color: #333;
    }

    .file-thumbnail {
      width: 50px;
      height: 50px;
      object-fit: cover;
      border-radius: 4px;
      display: block;
    }

    .file-icon {
      font-size: 2em;
      color: #666;
      display: flex;
      justify-content: center;
      align-items: center;
      width: 50px;
      height: 50px;
    }

    .action-btn {
      display: inline-block;
      margin-right: 5px;
      padding: 5px 8px;
      border-radius: 4px;
      text-decoration: none;
      color: white;
    }

    .view-btn {
      background-color: #28a745;
    }

    .view-btn:hover {
      background-color: #218838;
    }

    .error-message {
      color: red;
      background-color: #ffe0e0;
      border: 1px solid red;
      padding: 10px;
      border-radius: 4px;
      text-align: center;
      margin-top: 20px;
    }

    .loading-spinner, .no-files-message {
      text-align: center;
      padding: 20px;
      color: #666;
    }

    .pagination-controls {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-top: 20px;
      gap: 5px;
    }

    .pagination-controls button {
      background-color: #007bff;
      color: white;
      border: none;
      padding: 8px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9em;
      transition: background-color 0.3s ease;
    }

    .pagination-controls button:hover:not(:disabled) {
      background-color: #0056b3;
    }

    .pagination-controls button:disabled {
      background-color: #cccccc;
      cursor: not-allowed;
    }

    .pagination-controls span.page-info {
      margin: 0 10px;
      font-size: 0.9em;
      color: #333;
    }

    .pagination-controls button.active {
      background-color: #0056b3;
      border: 1px solid #0056b3;
      font-weight: bold;
    }
  `]
})
export class FileListComponent implements OnInit {
  private pageSubject = new BehaviorSubject<number>(1);
  paginatedFiles$!: Observable<PaginatedFiles>;
  error: string | null = null;
  isLoading: boolean = false;

  private limit: number = 10;

  // Propiedades para los filtros (valores iniciales)
  searchTerm: string = '';
  selectedTipo: string = '';
  selectedCategory: number | null = null;
  selectedAccessLevel: string = '';
  categories: any[] = []; // Puedes llenar esto desde un servicio de categorías
  userRole: string = 'Usuario'; // Define un rol de usuario de ejemplo

  constructor(private fileService: FileService /*, private categoryService: CategoryService */) {
    console.log('FileListComponent constructor called');
  }

  ngOnInit(): void {
    console.log('Environment API URL:', environment.apiUrl);

    // Si necesitas cargar categorías para los filtros, descomenta esto y el categoryService en el constructor:
    // this.loadCategories();

    this.paginatedFiles$ = this.pageSubject.pipe(
      tap(() => {
        this.error = null;
        this.isLoading = true;
        console.log('Fetching files for page:', this.pageSubject.value);
      }),
      switchMap(page =>
        this.fileService.getFiles(
          page,
          this.limit,
          this.selectedTipo || undefined,
          this.selectedCategory || undefined,
          this.searchTerm.trim() || undefined,
          this.selectedAccessLevel || undefined // ESTE ES EL SEXTO ARGUMENTO QUE ESPERA FileService.getFiles
        ).pipe(
          tap(data => {
            this.isLoading = false;
            console.log('API response for files:', data);
            if (data && data.archivos && data.archivos.length > 0) {
              console.log('Files received:', data.archivos.length);
            } else {
              console.log('No files received or empty array.');
            }
          }),
          catchError(err => {
            this.isLoading = false;
            console.error('Error loading files:', err);
            this.error = `Error al cargar los archivos: ${err.statusText || err.message || 'Error desconocido'}`;
            return of({ archivos: [], pagination: { page: 1, limit: this.limit, total: 0, pages: 0 } } as PaginatedFiles);
          })
        )
      )
    );
  }

  goToPage(page: number): void {
    // Obtén la paginación actual del BehaviorSubject para una validación precisa
    const currentPagination = this.paginatedFiles$ && (this.paginatedFiles$ as any).value ? (this.paginatedFiles$ as any).value.pagination : null;
    const totalPages = currentPagination ? currentPagination.pages : 1; // Asume 1 página si no hay datos

    if (page >= 1 && page <= totalPages) {
      this.pageSubject.next(page);
    } else {
      console.warn(`Intento de ir a la página ${page} fuera de rango. Páginas totales: ${totalPages}`);
    }
  }

  getFileUrl(ruta_storage: string): string {
    // Construye la URL completa de la imagen/recurso.
    // Ej: environment.apiUrl = 'http://localhost:3000'
    // ruta_storage = 'uploads/imagen_ejemplo.jpg'
    // Resultado: 'http://localhost:3000/uploads/imagen_ejemplo.jpg'
    const url = `${environment.apiUrl}/${ruta_storage}`;
    // console.log('URL generada para el recurso:', url); // Descomenta para depuración de URLs de recursos individuales
    return url;
  }

  // Este método genera el array de números de página para la paginación visual
  getPagesArray(currentPage: number, totalPages: number): number[] {
    const pagesArray = [];
    const maxPagesToShow = 5; // Cantidad de botones de página a mostrar
    let startPage: number, endPage: number;

    if (totalPages <= maxPagesToShow) {
      startPage = 1;
      endPage = totalPages;
    } else {
      const maxPagesBeforeCurrentPage = Math.floor(maxPagesToShow / 2);
      const maxPagesAfterCurrentPage = Math.ceil(maxPagesToShow / 2) - 1;
      if (currentPage <= maxPagesBeforeCurrentPage) {
        startPage = 1;
        endPage = maxPagesToShow;
      } else if (currentPage + maxPagesAfterCurrentPage >= totalPages) {
        startPage = totalPages - maxPagesToShow + 1;
        endPage = totalPages;
      } else {
        startPage = currentPage - maxPagesBeforeCurrentPage;
        endPage = currentPage + maxPagesAfterCurrentPage;
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pagesArray.push(i);
    }
    return pagesArray;
  }

  // --- Métodos para filtros y búsqueda ---

  // loadCategories(): void {
  //   this.categoryService.getCategories().subscribe({
  //     next: (categories) => {
  //       this.categories = categories;
  //       console.log('Categories loaded:', this.categories);
  //     },
  //     error: (err) => console.error('Error loading categories:', err)
  //   });
  // }

  onFilterChange(): void {
    console.log('Filter changed. Reloading files.');
    this.pageSubject.next(1); // Resetea a la primera página y recarga los archivos con los nuevos filtros
  }

  onSearch(): void {
    console.log('Search initiated with term:', this.searchTerm);
    this.pageSubject.next(1); // Resetea a la primera página y aplica la búsqueda
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedTipo = '';
    this.selectedCategory = null;
    this.selectedAccessLevel = '';
    this.pageSubject.next(1); // Recarga los archivos con los filtros reseteados
  }
}