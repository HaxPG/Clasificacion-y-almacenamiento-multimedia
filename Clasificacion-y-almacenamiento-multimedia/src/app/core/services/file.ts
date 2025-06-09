// src/app/core/services/file.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { File as AppFile, PaginatedFiles } from '../../shared/models/file';

@Injectable({
  providedIn: 'root'
})
export class FileService {
  // CORRECCIÓN CLAVE: Simplemente usa environment.apiUrl
  // Si environment.apiUrl es 'http://localhost:3000/api', entonces
  // this.apiUrl también será 'http://localhost:3000/api'.
  // Las peticiones a /archivos, /buscar, /estadisticas irán a
  // http://localhost:3000/api/archivos, http://localhost:3000/api/buscar, etc. (¡Correcto!)
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene la lista de archivos paginada con opciones de filtrado.
   */
  getFiles(
    page: number = 1,
    limit: number = 20,
    tipo?: string,
    id_categoria?: number,
    searchTerm?: string,
    nivel_acceso?: string
  ): Observable<PaginatedFiles> {
    let params = new HttpParams();
    params = params.append('page', page.toString());
    params = params.append('limit', limit.toString());

    if (tipo) {
      params = params.append('tipo', tipo);
    }
    if (id_categoria !== undefined && id_categoria !== null) {
      params = params.append('id_categoria', id_categoria.toString());
    }
    if (searchTerm && searchTerm.trim() !== '') {
      params = params.append('searchTerm', searchTerm.trim());
    }
    if (nivel_acceso) {
      params = params.append('nivel_acceso', nivel_acceso);
    }

    return this.http.get<PaginatedFiles>(`${this.apiUrl}/archivos`, { params });
  }

  /**
   * Sube un archivo al servidor junto con sus metadatos.
   */
  uploadFile(formData: FormData): Observable<HttpEvent<any>> {
    return this.http.post(`${this.apiUrl}/archivos`, formData, {
      reportProgress: true,
      observe: 'events'
    });
  }

  // searchFiles y getStatistics permanecen igual
  searchFiles(
    query: string,
    tipo?: string,
    id_categoria?: number
  ): Observable<AppFile[]> {
    let params = new HttpParams();
    params = params.append('q', query);
    if (tipo) params = params.append('tipo', tipo);
    if (id_categoria !== undefined && id_categoria !== null) params = params.append('id_categoria', id_categoria.toString());

    return this.http.get<AppFile[]>(`${this.apiUrl}/buscar`, { params });
  }

  getStatistics(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/estadisticas`);
  }
}