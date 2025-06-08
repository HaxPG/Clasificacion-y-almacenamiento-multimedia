// src/app/core/services/tag.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Tag } from '../../shared/models/tag'; // Asegúrate de que esta interfaz exista

@Injectable({
  providedIn: 'root'
})
export class TagService {
  private apiUrl = environment.apiUrl; // 'http://localhost:3000/api'

  constructor(private http: HttpClient) { }

  /**
   * Obtiene todos los tags.
   * Corresponde al endpoint GET /api/tags
   */
  getTags(): Observable<Tag[]> {
    return this.http.get<Tag[]>(`${this.apiUrl}/tags`);
  }

  /**
   * Obtiene un tag por su ID.
   * Corresponde al endpoint GET /api/tags/:id
   */
  getTagById(id: number): Observable<Tag> {
    return this.http.get<Tag>(`${this.apiUrl}/tags/${id}`);
  }

  /**
   * Crea un nuevo tag.
   * Corresponde al endpoint POST /api/tags
   */
  createTag(tag: { nombre: string }): Observable<Tag> {
    return this.http.post<Tag>(`${this.apiUrl}/tags`, tag);
  }

  /**
   * Actualiza un tag existente por su ID.
   * Corresponde al endpoint PUT /api/tags/:id
   */
  updateTag(id: number, tag: { nombre?: string }): Observable<Tag> {
    return this.http.put<Tag>(`${this.apiUrl}/tags/${id}`, tag);
  }

  /**
   * Elimina un tag por su ID.
   * Corresponde al endpoint DELETE /api/tags/:id
   */
  deleteTag(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/tags/${id}`);
  }
}