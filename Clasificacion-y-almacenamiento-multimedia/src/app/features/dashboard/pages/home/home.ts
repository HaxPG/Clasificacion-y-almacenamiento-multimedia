import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../../core/auth/auth';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { User } from '../../../../shared/models/user';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
  standalone: true,
  imports: [RouterLink, RouterModule, CommonModule]
})
export class HomeComponent implements OnInit {
  // Observable que contiene el usuario actualmente autenticado
  currentUser$: Observable<User | null>;

  // Estado de colapso del sidebar
  isCollapsed = false;

  // Controla la visibilidad del botón flotante ☰
  showToggleButton = false;

  constructor(private authService: AuthService, private router: Router) {
    // Se suscribe al observable del usuario autenticado desde el servicio
    this.currentUser$ = this.authService.user$;
  }

  ngOnInit(): void {}

  // Cierra sesión y redirige al login
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // Verifica si el usuario actual tiene rol de administrador
  public get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  // Verifica si el usuario actual tiene rol de periodista
  public get isJournalist(): boolean {
    return this.authService.isJournalist();
  }

  // Alterna la visibilidad del sidebar (abrir/cerrar)
  toggleSidebar(): void {
    if (!this.isCollapsed) {
      // Oculta el sidebar y, tras la animación, muestra el botón flotante
      this.showToggleButton = false;
      this.isCollapsed = true;

      setTimeout(() => {
        this.showToggleButton = true;
      }, 300);
    } else {
      // Muestra el sidebar y oculta el botón flotante
      this.isCollapsed = false;
      this.showToggleButton = false;
    }
  }
}
