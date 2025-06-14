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
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getFiles(
    page: number = 1,
    limit: number = 20,
    tipo?: string,
    id_categoria?: number,
    searchTerm?: string,
    nivel_acceso?: string
  ): Observable<PaginatedFiles> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (tipo) params = params.append('tipo', tipo);
    if (id_categoria !== undefined && id_categoria !== null) params = params.append('id_categoria', id_categoria.toString());
    if (searchTerm && searchTerm.trim() !== '') params = params.append('searchTerm', searchTerm.trim());
    if (nivel_acceso) params = params.append('nivel_acceso', nivel_acceso);

    return this.http.get<PaginatedFiles>(`${this.apiUrl}/archivos`, { params });
  }

  uploadFile(formData: FormData): Observable<HttpEvent<any>> {
    return this.http.post(`${this.apiUrl}/archivos`, formData, {
      reportProgress: true,
      observe: 'events'
    });
  }

  searchFiles(query: string, tipo?: string, id_categoria?: number): Observable<AppFile[]> {
    let params = new HttpParams().set('q', query);
    if (tipo) params = params.append('tipo', tipo);
    if (id_categoria !== undefined && id_categoria !== null) {
      params = params.append('id_categoria', id_categoria.toString());
    }

    return this.http.get<AppFile[]>(`${this.apiUrl}/buscar`, { params });
  }

  getStatistics(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/estadisticas`);
  }

  registrarDescarga(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/archivos/${id}/descarga`, {});
  }

  // ✅ Renombrado para evitar colisión
  descargarArchivoBlob(filename: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/descargar/${filename}`, {
      responseType: 'blob',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`
      }
    });
  }
}
