// src/app/features/dashboard/components/file-list/file-list.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { BehaviorSubject, Observable, of, switchMap, tap, catchError } from 'rxjs';

import { FileService } from '../../../../core/services/file';
import { File as AppFile, PaginatedFiles } from '../../../../shared/models/file';
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
  private pageSubject = new BehaviorSubject<number>(1);
  paginatedFiles$!: Observable<PaginatedFiles>;
  error: string | null = null;
  isLoading: boolean = false;

  private limit: number = 10;

  // Filtros
  searchTerm: string = '';
  selectedTipo: string = '';
  selectedCategory: number | null = null;
  selectedAccessLevel: string = '';
  categories: any[] = [];
  userRole: string = 'Usuario';

  // Modal
  archivoSeleccionado: AppFile | null = null;

  constructor(private fileService: FileService) {}

  ngOnInit(): void {
    this.paginatedFiles$ = this.pageSubject.pipe(
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
          this.searchTerm.trim() || undefined,
          this.selectedAccessLevel || undefined
        ).pipe(
          tap(() => this.isLoading = false),
          catchError(err => {
            this.isLoading = false;
            this.error = `Error al cargar los archivos: ${err.statusText || err.message || 'Error desconocido'}`;
            return of({ archivos: [], pagination: { page: 1, limit: this.limit, total: 0, pages: 0 } } as PaginatedFiles);
          })
        )
      )
    );
  }

  // Métodos para paginación y filtros
  goToPage(page: number): void {
    this.pageSubject.next(page);
  }

  getPagesArray(currentPage: number, totalPages: number): number[] {
    const pagesArray = [];
    const maxPagesToShow = 5;
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

  onFilterChange(): void {
    this.pageSubject.next(1);
  }

  onSearch(): void {
    this.pageSubject.next(1);
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedTipo = '';
    this.selectedCategory = null;
    this.selectedAccessLevel = '';
    this.pageSubject.next(1);
  }

  getFileUrl(ruta_storage: string): string {
    return `${environment.apiUrl}/${ruta_storage}`;
  }

  // Modal
  mostrarDetalle(archivo: AppFile): void {
    this.archivoSeleccionado = archivo;
  }

  cerrarModal(): void {
    this.archivoSeleccionado = null;
  }
}
