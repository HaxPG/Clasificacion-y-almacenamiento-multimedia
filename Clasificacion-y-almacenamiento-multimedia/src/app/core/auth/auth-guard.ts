// src/app/core/auth/auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from './auth'; // Apunta a tu archivo auth.service.ts
import { tap, map } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    const requiredRoles = route.data['roles'] as Array<string>;

    return this.authService.user$.pipe(
      map(user => {
        if (user && this.authService.getToken()) {
          if (requiredRoles && !requiredRoles.includes(user.rol)) {
            // User is logged in but doesn't have the required role
            this.router.navigate(['/unauthorized']); // O a una página de inicio
            return false;
          }
          return true; // User is logged in and has the required role or no role is required
        } else {
          // User is not logged in
          this.router.navigate(['/login']);
          return false;
        }
      })
    );
  }
}