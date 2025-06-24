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

  /**
   * Obtiene archivos paginados desde el backend con filtros opcionales.
   * @param page Página actual
   * @param limit Cantidad de elementos por página
   * @param tipo Tipo de archivo (opcional)
   * @param id_categoria ID de la categoría (opcional)
   * @param searchTerm Término de búsqueda (opcional)
   * @param nivel_acceso Nivel de acceso del archivo (opcional)
   */
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

  /**
   * Sube un archivo al backend utilizando FormData.
   * Se configuran opciones para observar el progreso de carga.
   */
  uploadFile(formData: FormData): Observable<HttpEvent<any>> {
    return this.http.post(`${this.apiUrl}/archivos`, formData, {
      reportProgress: true,
      observe: 'events'
    });
  }

  /**
   * Busca archivos utilizando un query string, con filtros opcionales por tipo y categoría.
   * @param query Término de búsqueda
   * @param tipo Tipo de archivo (opcional)
   * @param id_categoria ID de categoría (opcional)
   */
  searchFiles(query: string, tipo?: string, id_categoria?: number): Observable<AppFile[]> {
    let params = new HttpParams().set('q', query);
    if (tipo) params = params.append('tipo', tipo);
    if (id_categoria !== undefined && id_categoria !== null) {
      params = params.append('id_categoria', id_categoria.toString());
    }

    return this.http.get<AppFile[]>(`${this.apiUrl}/buscar`, { params });
  }

  /**
   * Obtiene estadísticas generales del sistema desde el backend.
   */
  getStatistics(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/estadisticas`);
  }

  /**
   * Registra una descarga para un archivo específico.
   * @param id ID del archivo descargado
   */
  registrarDescarga(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/archivos/${id}/descarga`, {});
  }

  /**
   * Descarga un archivo como Blob, útil para archivos binarios.
   * Incluye el token manualmente en el header por si el interceptor no aplica.
   * @param filename Nombre del archivo
   */
  descargarArchivoBlob(filename: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/descargar/${filename}`, {
      responseType: 'blob',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`
      }
    });
  }
}
