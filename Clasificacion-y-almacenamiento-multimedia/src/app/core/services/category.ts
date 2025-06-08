// src/app/core/services/category.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Category } from '../../shared/models/category'; // Asegúrate de que esta interfaz exista

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private apiUrl = environment.apiUrl; // 'http://localhost:3000/api'

  constructor(private http: HttpClient) { }

  /**
   * Obtiene todas las categorías.
   * Corresponde al endpoint GET /api/categorias
   */
  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/categorias`);
  }

  /**
   * Obtiene una categoría por su ID.
   * Corresponde al endpoint GET /api/categorias/:id
   */
  getCategoryById(id: number): Observable<Category> {
    return this.http.get<Category>(`${this.apiUrl}/categorias/${id}`);
  }

  /**
   * Crea una nueva categoría.
   * Corresponde al endpoint POST /api/categorias
   */
  createCategory(category: { nombre: string; id_padre?: number }): Observable<Category> {
    return this.http.post<Category>(`${this.apiUrl}/categorias`, category);
  }

  /**
   * Actualiza una categoría existente por su ID.
   * Corresponde al endpoint PUT /api/categorias/:id
   */
  updateCategory(id: number, category: { nombre?: string; id_padre?: number | null }): Observable<Category> {
    // Si id_padre es null, asegúrate de enviarlo como null en el JSON si tu backend lo acepta para desvincular un padre.
    // O puedes omitirlo si el backend espera que solo esté presente para establecer uno nuevo.
    return this.http.put<Category>(`${this.apiUrl}/categorias/${id}`, category);
  }

  /**
   * Elimina una categoría por su ID.
   * Corresponde al endpoint DELETE /api/categorias/:id
   */
  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/categorias/${id}`);
  }
}