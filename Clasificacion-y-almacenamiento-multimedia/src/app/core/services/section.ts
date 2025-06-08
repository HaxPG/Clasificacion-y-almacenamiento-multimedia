// src/app/core/services/section.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Section } from '../../shared/models/section'; // Asegúrate de que esta interfaz exista

@Injectable({
  providedIn: 'root'
})
export class SectionService {
  private apiUrl = environment.apiUrl; // 'http://localhost:3000/api'

  constructor(private http: HttpClient) { }

  /**
   * Obtiene todas las secciones.
   * Corresponde al endpoint GET /api/secciones
   */
  getSections(): Observable<Section[]> {
    return this.http.get<Section[]>(`${this.apiUrl}/secciones`);
  }

  /**
   * Obtiene una sección por su ID.
   * Corresponde al endpoint GET /api/secciones/:id
   */
  getSectionById(id: number): Observable<Section> {
    return this.http.get<Section>(`${this.apiUrl}/secciones/${id}`);
  }

  /**
   * Crea una nueva sección.
   * Corresponde al endpoint POST /api/secciones
   */
  createSection(section: { nombre: string }): Observable<Section> {
    return this.http.post<Section>(`${this.apiUrl}/secciones`, section);
  }

  /**
   * Actualiza una sección existente por su ID.
   * Corresponde al endpoint PUT /api/secciones/:id
   */
  updateSection(id: number, section: { nombre?: string }): Observable<Section> {
    return this.http.put<Section>(`${this.apiUrl}/secciones/${id}`, section);
  }

  /**
   * Elimina una sección por su ID.
   * Corresponde al endpoint DELETE /api/secciones/:id
   */
  deleteSection(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/secciones/${id}`);
  }
}