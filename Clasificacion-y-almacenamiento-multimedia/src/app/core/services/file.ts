// src/app/core/services/file/file.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpEvent, HttpEventType } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment'; // Asegúrate que la ruta sea correcta

@Injectable({
  providedIn: 'root'
})
export class FileService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Método para obtener los encabezados de autorización (JWT)
  private getAuthHeaders(): HttpHeaders {
    // Aquí deberías obtener el token de donde lo almacenes, por ejemplo, localStorage o un servicio de autenticación
    const token = localStorage.getItem('jwt_token'); // O tu método para obtener el token
    if (token) {
      return new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });
    }
    return new HttpHeaders(); // Retorna un HttpHeaders vacío si no hay token
  }

  /**
   * Obtiene la lista de archivos paginada y filtrada.
   */
  getFiles(
    page: number,
    limit: number,
    tipo?: string,
    categoria?: number,
    tag?: string,
    nivel_acceso?: string
  ): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (tipo) params = params.set('tipo', tipo);
    if (categoria) params = params.set('categoria', categoria.toString());
    if (tag) params = params.set('tag', tag);
    if (nivel_acceso) params = params.set('nivel_acceso', nivel_acceso);

    return this.http.get<any>(`${this.apiUrl}/archivos`, { headers: this.getAuthHeaders(), params });
  }

  /**
   * Registra una descarga en el backend (ruta PATCH).
   * Esta ruta solo incrementa el contador y retorna un mensaje, NO descarga el archivo.
   * Se mantiene por si necesitas la funcionalidad de "solo contar" de forma independiente.
   */
  registrarDescarga(fileId: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/archivos/${fileId}/descarga`, {}, { headers: this.getAuthHeaders() });
  }

  /**
   * Inicia la descarga de un archivo directamente desde el backend (ruta GET).
   * Esta ruta ya incrementa el contador de descargas en el servidor.
   * Retorna un Blob para que el frontend pueda manejar la descarga.
   */
  downloadFile(fileId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/descargar/${fileId}`, {
      headers: this.getAuthHeaders(),
      responseType: 'blob' // Es crucial indicar que esperamos un Blob (el contenido binario del archivo)
    });
  }

  /**
   * Sube un archivo al servidor.
   * Utiliza reportProgress para obtener eventos de progreso.
   * @param formData El FormData que contiene el archivo y otros datos.
   * @returns Un Observable de HttpEvent para el progreso de la subida.
   */
  uploadFile(formData: FormData): Observable<HttpEvent<any>> {
    // La cabecera Content-Type para FormData es establecida automáticamente por el navegador
    // al usar un objeto FormData, incluyendo el 'boundary'. No necesitas setearla manualmente aquí.
    return this.http.post<any>(`${this.apiUrl}/archivos`, formData, {
      headers: this.getAuthHeaders(),
      reportProgress: true, // Habilitar reportes de progreso
      observe: 'events'     // Observar todos los eventos HTTP (UploadProgress, Response, etc.)
    });
  }
}
