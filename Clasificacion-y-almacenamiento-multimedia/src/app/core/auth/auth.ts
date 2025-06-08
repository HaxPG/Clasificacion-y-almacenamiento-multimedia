// src/app/core/auth/auth.service.ts
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { User } from '../../shared/models/user'; // Asegúrate de que la ruta sea correcta

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
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
        const user: User = JSON.parse(userString);
        this.userSubject.next(user);
      }
    }
  }

  login(credentials: { correo: string; contraseña: string }): Observable<{ token: string; user: User }> {
    return this.http.post<{ token: string; user: User }>(`${this.apiUrl}/auth/login`, credentials).pipe(
      tap(response => {
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem('jwtToken', response.token);
          localStorage.setItem('currentUser', JSON.stringify(response.user));
        }
        this.userSubject.next(response.user);
      }),
      catchError(error => {
        console.error('Login failed', error);
        return of(error); // O manejar el error de forma más sofisticada
      })
    );
  }

  register(userData: { nombre: string; correo: string; contraseña: string; rol: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, userData);
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('jwtToken');
      localStorage.removeItem('currentUser');
    }
    this.userSubject.next(null);
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

  // Puedes añadir más getters para el rol si es necesario
}