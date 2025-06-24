// src/app/core/auth/auth.service.ts
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { User } from '../../shared/models/user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // URL base para las peticiones de autenticación
  private authBaseUrl = `${environment.apiUrl}/auth`;

  // Sujeto reactivo que mantiene el usuario actual en memoria
  private userSubject = new BehaviorSubject<User | null>(null);
  public user$ = this.userSubject.asObservable();

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.loadCurrentUser(); // Intenta cargar el usuario desde localStorage si está en el navegador
  }

  /**
   * Carga el usuario desde el localStorage si está disponible (solo en navegador).
   * Si hay errores de parseo, limpia los datos inválidos.
   */
  private loadCurrentUser(): void {
    if (isPlatformBrowser(this.platformId)) {
      const userString = localStorage.getItem('currentUser');
      if (userString) {
        try {
          const user: User = JSON.parse(userString);
          this.userSubject.next(user);
        } catch (e) {
          console.error("Error parsing user from localStorage", e);
          localStorage.removeItem('currentUser');
          localStorage.removeItem('jwtToken');
        }
      }
    }
  }

  /**
   * Inicia sesión con las credenciales proporcionadas.
   * Guarda el token y el usuario en localStorage, y actualiza el estado global.
   */
  login(credentials: { correo: string; contraseña: string }): Observable<{ token: string; user: User }> {
    return this.http.post<{ token: string; user: User }>(`${this.authBaseUrl}/login`, credentials).pipe(
      tap(response => {
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem('jwtToken', response.token);
          localStorage.setItem('currentUser', JSON.stringify(response.user));
        }
        this.userSubject.next(response.user);
        console.log('Login successful, token and user saved:', response);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Login failed', error);

        this.userSubject.next(null);

        // Manejo detallado de errores para proporcionar feedback útil
        let errorMessage = 'Error desconocido al iniciar sesión.';
        if (error.status === 401) {
          errorMessage = 'Credenciales inválidas (correo o contraseña incorrectos).';
        } else if (error.status === 404) {
          errorMessage = 'Endpoint de inicio de sesión no encontrado. Verifica la URL del backend.';
        } else if (error.error && error.error.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = `Error de conexión: ${error.message}`;
        }
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Registra un nuevo usuario con los datos proporcionados.
   * No guarda el estado del usuario automáticamente.
   */
  register(userData: { nombre: string; correo: string; contraseña: string; rol: string }): Observable<any> {
    return this.http.post(`${this.authBaseUrl}/register`, userData).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Registration failed', error);
        let errorMessage = 'Error al registrar usuario.';
        if (error.error && error.error.message) {
          errorMessage = error.error.message;
        }
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Cierra sesión eliminando los datos del usuario y el token del localStorage.
   */
  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('jwtToken');
      localStorage.removeItem('currentUser');
    }
    this.userSubject.next(null);
    console.log('User logged out.');
  }

  /**
   * Obtiene el token JWT almacenado en localStorage (si está en navegador).
   */
  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('jwtToken');
    }
    return null;
  }

  /**
   * Verifica si el usuario está autenticado y tiene un token válido.
   */
  isLoggedIn(): boolean {
    return !!this.getToken() && !!this.userSubject.value;
  }

  /**
   * Verifica si el usuario actual tiene el rol 'Administrador'.
   */
  isAdmin(): boolean {
    return this.userSubject.value?.rol === 'Administrador';
  }

  /**
   * Verifica si el usuario actual tiene el rol 'Periodista'.
   */
  isJournalist(): boolean {
    return this.userSubject.value?.rol === 'Periodista';
  }
}
