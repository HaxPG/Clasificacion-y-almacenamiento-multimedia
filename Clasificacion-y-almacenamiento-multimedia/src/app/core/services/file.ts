// src/app/core/services/file.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment'; // Path to environment seems correct
import { File } from '../../shared/models/file'; // Corrected: Import File from file.ts
import { PaginatedFiles } from '../../shared/models/pagination'; // Corrected: Import PaginatedFiles from pagination.ts

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
    categoria?: number,
    tag?: string,
    nivel_acceso?: string
  ): Observable<PaginatedFiles> {
    let params = new HttpParams();
    params = params.append('page', page.toString());
    params = params.append('limit', limit.toString());
    if (tipo) params = params.append('tipo', tipo);
    if (categoria) params = params.append('categoria', categoria.toString());
    if (tag) params = params.append('tag', tag);
    if (nivel_acceso) params = params.append('nivel_acceso', nivel_acceso);

    return this.http.get<PaginatedFiles>(`${this.apiUrl}/archivos`, { params });
  }

  uploadFile(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/archivos`, formData);
  }

  searchFiles(
    query: string,
    tipo?: string,
    categoria?: number
  ): Observable<File[]> {
    let params = new HttpParams();
    params = params.append('q', query);
    if (tipo) params = params.append('tipo', tipo);
    if (categoria) params = params.append('categoria', categoria.toString());

    return this.http.get<File[]>(`${this.apiUrl}/buscar`, { params });
  }

  getStatistics(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/estadisticas`);
  }

  // Agrega métodos para obtener, actualizar, eliminar archivos si es necesario
}