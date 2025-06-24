// src/app/core/auth/auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from './auth';
import { tap, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  /**
   * Determina si una ruta puede ser activada según el estado de autenticación del usuario.
   * Si el usuario no está autenticado, se redirige al login.
   * Si el usuario está autenticado pero no tiene el rol requerido, se redirige a /unauthorized.
   * 
   * @param route - información de la ruta solicitada (incluye roles requeridos en data)
   * @param state - estado del router en el momento de la navegación
   * @returns booleano o UrlTree (para redirección), envuelto en un observable
   */
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    const requiredRoles = route.data['roles'] as Array<string>; // Roles requeridos definidos en el módulo de rutas

    return this.authService.user$.pipe(
      map(user => {
        if (user && this.authService.getToken()) {
          // Usuario autenticado
          if (requiredRoles && !requiredRoles.includes(user.rol)) {
            // Usuario autenticado pero sin los roles necesarios
            this.router.navigate(['/unauthorized']);
            return false;
          }
          // Usuario autenticado con rol válido (o no se requieren roles)
          return true;
        } else {
          // Usuario no autenticado
          this.router.navigate(['/login']);
          return false;
        }
      })
    );
  }
}
