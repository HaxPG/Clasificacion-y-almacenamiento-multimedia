// src/app/core/services/file.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpEvent } from '@angular/common/http'; // Importa HttpEvent
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { File as AppFile, PaginatedFiles } from '../../shared/models/file';

@Injectable({
  providedIn: 'root'
})
export class FileService {
  private apiUrl = `${environment.apiUrl}/api`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene la lista de archivos paginada con opciones de filtrado.
   * (Este método ya estaba bien para la funcionalidad de listado)
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
   * Ahora incluye el seguimiento del progreso de la subida.
   *
   * @param formData Objeto FormData que contiene el archivo y los metadatos.
   * @returns Un Observable que emite eventos HTTP (progreso, respuesta final).
   */
  uploadFile(formData: FormData): Observable<HttpEvent<any>> { // Cambiado a HttpEvent<any>
    return this.http.post(`${this.apiUrl}/archivos`, formData, {
      reportProgress: true, // Habilita el seguimiento del progreso de la subida
      observe: 'events'    // Observa todos los eventos HTTP (incluyendo HttpEventType.UploadProgress)
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
