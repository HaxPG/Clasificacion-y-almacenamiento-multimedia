// src/app/core/auth/token.interceptor.ts
import { HttpRequest, HttpHandlerFn, HttpEvent, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from './auth';

/**
 * Interceptor HTTP que agrega el token JWT al encabezado Authorization de cada solicitud saliente.
 * Solo se aplica si el token está disponible en el servicio de autenticación.
 */
export const tokenInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // Si existe un token, clona la solicitud agregando el encabezado Authorization
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  // Pasa la solicitud (modificada o no) al siguiente manejador
  return next(req);
};
