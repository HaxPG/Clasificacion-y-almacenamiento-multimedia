// src/app/core/services/collection.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Collection } from '../../shared/models/collection';// Asegúrate de que esta interfaz exista

@Injectable({
  providedIn: 'root'
})
export class CollectionService {
  private apiUrl = environment.apiUrl; // 'http://localhost:3000/api'

  constructor(private http: HttpClient) { }

  /**
   * Obtiene todas las colecciones.
   * Corresponde al endpoint GET /api/colecciones
   */
  getCollections(): Observable<Collection[]> {
    return this.http.get<Collection[]>(`${this.apiUrl}/colecciones`);
  }

  /**
   * Obtiene una colección por su ID.
   * Corresponde al endpoint GET /api/colecciones/:id
   */
  getCollectionById(id: number): Observable<Collection> {
    return this.http.get<Collection>(`${this.apiUrl}/colecciones/${id}`);
  }

  /**
   * Crea una nueva colección.
   * Corresponde al endpoint POST /api/colecciones
   */
  createCollection(collection: { nombre: string; descripcion?: string }): Observable<Collection> {
    return this.http.post<Collection>(`${this.apiUrl}/colecciones`, collection);
  }

  /**
   * Actualiza una colección existente por su ID.
   * Corresponde al endpoint PUT /api/colecciones/:id
   */
  updateCollection(id: number, collection: { nombre?: string; descripcion?: string }): Observable<Collection> {
    return this.http.put<Collection>(`${this.apiUrl}/colecciones/${id}`, collection);
  }

  /**
   * Elimina una colección por su ID.
   * Corresponde al endpoint DELETE /api/colecciones/:id
   */
  deleteCollection(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/colecciones/${id}`);
  }
}