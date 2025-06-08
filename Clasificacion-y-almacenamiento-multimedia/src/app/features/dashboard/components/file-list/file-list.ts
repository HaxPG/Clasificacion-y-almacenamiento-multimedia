import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, BehaviorSubject, switchMap, catchError, of, tap } from 'rxjs';
import { FileService } from '../../../../core/services/file'; // Asegúrate que FileService esté en esta ruta
import { File as AppFile, PaginatedFiles, Pagination } from '../../../../shared/models/file'; // 'File' renombrado a 'AppFile' para evitar colisión de nombres

@Component({
  selector: 'app-file-list',
  standalone: true,
  imports: [CommonModule], // Necesario para *ngFor, *ngIf, async pipe, etc.
  template: `
    <div class="file-list-container">
      <h2>Lista de Archivos</h2>
      <div *ngIf="paginatedFiles$ | async as data; else loadingOrError">
        <div *ngIf="data.archivos && data.archivos.length > 0; else noFiles">
          <ul>
            <li *ngFor="let file of data.archivos">
              {{ file.nombre_archivo }} ({{ file.tipo }})
              <!-- Aquí puedes añadir más detalles o acciones por archivo -->
            </li>
          </ul>
          <div [class.pagination-controls]="true" *ngIf="data.pagination as pagination">
            <span>Página {{ pagination.page }} de {{ pagination.pages }} (Total: {{ pagination.total }})</span>
            <button (click)="goToPage(pagination.page - 1)" [disabled]="pagination.page <= 1">Anterior</button>
            <button (click)="goToPage(pagination.page + 1)" [disabled]="pagination.page >= pagination.pages">Siguiente</button>
          </div>
        </div>
        <ng-template #noFiles>
          <p>No se encontraron archivos.</p>
        </ng-template>
      </div>
      <ng-template #loadingOrError>
        <div *ngIf="error; else loading" class="error-message">
          <p>{{ error }}</p>
        </div>
        <ng-template #loading>
          <p>Cargando archivos...</p>
        </ng-template>
      </ng-template>
    </div>
  `,
  styles: [`
    .file-list-container { padding: 20px; }
    .error-message { color: red; margin-top: 10px; }
    .pagination-controls { margin-top: 15px; }
    .pagination-controls button { margin: 0 5px; padding: 8px 12px; cursor: pointer; }
    .pagination-controls button:disabled { cursor: not-allowed; opacity: 0.6; }
    ul { list-style-type: none; padding: 0; }
    li { background-color: #f9f9f9; border: 1px solid #ddd; margin-bottom: 8px; padding: 10px 15px; border-radius: 4px; }
  `]
})
export class FileListComponent implements OnInit { // ¡Añade 'Component' y mayúscula en la 'C'!
  private pageSubject = new BehaviorSubject<number>(1);
  paginatedFiles$!: Observable<PaginatedFiles>;
  error: string | null = null;
  
  private limit: number = 10; // Puedes hacerlo configurable

  constructor(private fileService: FileService) {}

  ngOnInit(): void {
    this.paginatedFiles$ = this.pageSubject.pipe(
      tap(() => this.error = null), // Resetea el error en cada nueva petición de página
      switchMap(page => 
        this.fileService.getFiles(page, this.limit).pipe(
          catchError(err => {
            console.error('Error loading files:', err);
            this.error = `Error al cargar los archivos: ${err.error?.message || err.message || 'Error desconocido'}`;
            // Devuelve un estado vacío para que la UI pueda manejarlo
            return of({ archivos: [], pagination: { page: 1, limit: this.limit, total: 0, pages: 0 } as Pagination } as PaginatedFiles);
          })
        )
      )
    );
  }

  goToPage(page: number): void {
    if (page >= 1) { // Validación básica
      this.pageSubject.next(page);
    }
  }
}