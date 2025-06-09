// src/app/core/auth/auth.service.ts
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { User } from '../../shared/models/user'; // Asegúrate de que la ruta sea correcta

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // CORRECCIÓN CLAVE: authBaseUrl debe ser `${environment.apiUrl}/auth`
  // Si environment.apiUrl es 'http://localhost:3000/api', entonces
  // authBaseUrl será 'http://localhost:3000/api/auth'.
  // Las peticiones a /login y /register se dirigirán a /api/auth/login y /api/auth/register.
  private authBaseUrl = `${environment.apiUrl}/auth`;

  private userSubject = new BehaviorSubject<User | null>(null);
  public user$ = this.userSubject.asObservable();

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.loadCurrentUser();
  }

  private loadCurrentUser(): void {
    if (isPlatformBrowser(this.platformId)) {
      const userString = localStorage.getItem('currentUser');
      if (userString) {
        try {
          const user: User = JSON.parse(userString);
          this.userSubject.next(user);
        } catch (e) {
          console.error("Error parsing user from localStorage", e);
          localStorage.removeItem('currentUser'); // Limpia datos corruptos
          localStorage.removeItem('jwtToken');
        }
      }
    }
  }

  login(credentials: { correo: string; contraseña: string }): Observable<{ token: string; user: User }> {
    // La URL de login ahora será: http://localhost:3000/api/auth/login (¡Correcto!)
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

        let errorMessage = 'Error desconocido al iniciar sesión.';
        if (error.status === 401) {
          errorMessage = 'Credenciales inválidas (correo o contraseña incorrectos).';
        } else if (error.status === 404) {
          errorMessage = 'El servidor no encontró el endpoint de inicio de sesión. Revisa la URL.';
        } else if (error.error && error.error.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = `Error de conexión: ${error.message}`;
        }
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  register(userData: { nombre: string; correo: string; contraseña: string; rol: string }): Observable<any> {
    // La URL de registro ahora será: http://localhost:3000/api/auth/register (¡Correcto!)
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

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('jwtToken');
      localStorage.removeItem('currentUser');
    }
    this.userSubject.next(null);
    console.log('User logged out.');
  }

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('jwtToken');
    }
    return null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken() && !!this.userSubject.value;
  }

  isAdmin(): boolean {
    return this.userSubject.value?.rol === 'Administrador';
  }

  isJournalist(): boolean {
    return this.userSubject.value?.rol === 'Periodista';
  }
}