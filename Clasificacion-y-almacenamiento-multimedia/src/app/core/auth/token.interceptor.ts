// src/app/core/auth/token.interceptor.ts
import { HttpRequest, HttpEvent, HttpInterceptorFn, HttpHandlerFn } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth';
import { inject } from '@angular/core';

/**
 * Interceptor que añade el token JWT al encabezado Authorization de cada solicitud HTTP saliente,
 * si el usuario está autenticado. Utiliza la función inject() para acceder al AuthService.
 */
export const tokenInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService); // Accede dinámicamente al servicio de autenticación
  const token = authService.getToken(); // Recupera el token desde localStorage (si está disponible)

  if (token) {
    // Si existe token, se clona la solicitud y se agrega el encabezado Authorization
    request = request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  // Se pasa la solicitud (original o modificada) al siguiente interceptor o manejador final
  return next(request);
};
