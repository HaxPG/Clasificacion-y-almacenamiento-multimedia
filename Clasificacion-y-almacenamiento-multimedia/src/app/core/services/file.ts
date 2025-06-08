// src/app/core/services/file.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment'; // Path to environment seems correct
import { File as AppFile, PaginatedFiles } from '../../shared/models/file'; // Corrected: Import File as AppFile to avoid name collision, and PaginatedFiles from file.ts as it contains both.
// Si tenías PaginatedFiles en otro archivo llamado 'pagination.ts', asegúrate que la ruta sea correcta.
// Si PaginatedFiles está en 'file.ts' junto con la interfaz File, entonces la importación de arriba es correcta.

@Injectable({
  providedIn: 'root'
})
export class FileService {
  // CORRECCIÓN CLAVE: Añadir /api a la URL base
  private apiUrl = `${environment.apiUrl}/api`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene la lista de archivos paginada con opciones de filtrado.
   *
   * @param page Número de página actual.
   * @param limit Límite de elementos por página.
   * @param tipo (Opcional) Filtro por tipo de archivo (imagen, video, audio, documento).
   * @param id_categoria (Opcional) Filtro por ID de categoría.
   * @param searchTerm (Opcional) Término de búsqueda general para nombre, fuente, lugar, etc.
   * @param nivel_acceso (Opcional) Filtro por nivel de acceso (público, restringido, privado).
   * @returns Un Observable que emite un objeto PaginatedFiles.
   */
  getFiles(
    page: number = 1,
    limit: number = 20,
    tipo?: string,
    id_categoria?: number, // Renombrado de 'categoria' a 'id_categoria' para consistencia con el modelo y el backend
    searchTerm?: string,   // CORRECCIÓN: Usamos 'searchTerm' para coincidir con el componente
    nivel_acceso?: string
  ): Observable<PaginatedFiles> {
    let params = new HttpParams();
    params = params.append('page', page.toString());
    params = params.append('limit', limit.toString());

    if (tipo) {
      params = params.append('tipo', tipo);
    }
    // Asegúrate de que el nombre del parámetro coincida con lo que tu backend espera para la categoría
    if (id_categoria !== undefined && id_categoria !== null) {
      params = params.append('id_categoria', id_categoria.toString()); // Usamos 'id_categoria' aquí para el backend
    }
    if (searchTerm && searchTerm.trim() !== '') {
      params = params.append('searchTerm', searchTerm.trim()); // Usamos 'searchTerm' aquí para el backend
    }
    if (nivel_acceso) {
      params = params.append('nivel_acceso', nivel_acceso);
    }

    // La URL de la petición ahora será por ejemplo: http://localhost:3000/api/archivos?page=1&limit=10
    return this.http.get<PaginatedFiles>(`${this.apiUrl}/archivos`, { params });
  }

  uploadFile(formData: FormData): Observable<any> {
    // La URL de subida también necesita el /api
    return this.http.post(`${this.apiUrl}/archivos`, formData); // Asumo que este es el endpoint para subir
  }

  // Si tu backend tiene un endpoint específico para 'buscar', úsalo.
  // Si 'getFiles' ya maneja la búsqueda con 'searchTerm', este método podría ser redundante
  // o podrías ajustarlo para una búsqueda más específica si tu backend lo permite.
  searchFiles(
    query: string,
    tipo?: string,
    id_categoria?: number // Renombrado de 'categoria' a 'id_categoria'
  ): Observable<AppFile[]> { // Usamos AppFile para evitar colisión de nombres con la interfaz 'File' nativa de JS
    let params = new HttpParams();
    params = params.append('q', query);
    if (tipo) params = params.append('tipo', tipo);
    if (id_categoria !== undefined && id_categoria !== null) params = params.append('id_categoria', id_categoria.toString());

    // Asumo que el endpoint de búsqueda es /api/buscar
    return this.http.get<AppFile[]>(`${this.apiUrl}/buscar`, { params });
  }

  getStatistics(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/estadisticas`);
  }

  // Agrega métodos para obtener, actualizar, eliminar archivos si es necesario
  // getFileById(id: number): Observable<AppFile> {
  //   return this.http.get<AppFile>(`${this.apiUrl}/archivos/${id}`);
  // }

  // updateFile(id: number, data: any): Observable<AppFile> {
  //   return this.http.put<AppFile>(`${this.apiUrl}/archivos/${id}`, data);
  // }

  // deleteFile(id: number): Observable<void> {
  //   return this.http.delete<void>(`${this.apiUrl}/archivos/${id}`);
  // }
}