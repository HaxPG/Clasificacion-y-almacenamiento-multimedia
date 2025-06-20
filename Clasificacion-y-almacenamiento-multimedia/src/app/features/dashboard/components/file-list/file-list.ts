import { Component, OnInit } from '@angular/core'; 
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { BehaviorSubject, Observable, of, switchMap, tap, catchError } from 'rxjs';

import { FileService } from '../../../../core/services/file';
import { File as AppFile } from '../../../../shared/models/file';
import { environment } from '../../../../../environments/environment';

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
  archivos$: Observable<{ archivos: AppFile[] }> = new Observable();
  error: string | null = null;
  isLoading: boolean = false;

  private limit: number = 1000;
  private pageSubject = new BehaviorSubject<number>(1);

  tagTerm: string = '';  // Cambio aquí
  selectedTipo: string = '';
  selectedCategory: number | null = null;
  selectedAccessLevel: string = '';
  categories: any[] = [];
  userRole: string = 'Usuario';

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
          this.tagTerm.trim() || undefined,  // Usamos tagTerm en lugar de searchTerm
          this.selectedAccessLevel || undefined
        ).pipe(
          tap(() => this.isLoading = false),
          catchError(err => {
            this.isLoading = false;
            this.error = `Error al cargar los archivos: ${err.statusText || err.message || 'Error desconocido'}`;
            return of({ archivos: [] });
          })
        )
      )
    );
  }

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
    this.tagTerm = '';  // También reseteamos tagTerm
    this.selectedTipo = '';
    this.selectedCategory = null;
    this.selectedAccessLevel = '';
    this.pageSubject.next(1);
  }

  getFileUrl(ruta: string): string {
    return `${environment.apiUrl}/${ruta}`;
  }

  mostrarDetalle(archivo: AppFile): void {
    this.archivoSeleccionado = archivo;
  }

  cerrarModal(): void {
    this.archivoSeleccionado = null;
  }

  descargarArchivo(archivo: AppFile): void {
    this.fileService.registrarDescarga(archivo.id_archivo).subscribe({
      next: () => {
        if (archivo.downloads !== undefined) archivo.downloads++;

        const url = this.getFileUrl(archivo.ruta_storage);
        const a = document.createElement('a');
        a.href = url;
        a.download = archivo.nombre_archivo || 'archivo';
        a.target = '_blank';
        a.click();
      },
      error: err => console.error("❌ Error registrando descarga", err)
    });
  }
}
