import { Component, OnInit, HostListener } from '@angular/core';
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
  currentUser$: Observable<User | null>;
  isCollapsed = false;
  showToggleButton = false;

  constructor(private authService: AuthService, private router: Router) {
    this.currentUser$ = this.authService.user$;
  }

  ngOnInit(): void {
    this.updateResponsiveState();
  }

  // Escucha cambios en el tamaño de la ventana para reactivar el botón flotante si corresponde
  @HostListener('window:resize', [])
  onWindowResize() {
    this.updateResponsiveState();
  }

  private updateResponsiveState(): void {
    const isMobile = window.innerWidth <= 768;
    this.showToggleButton = isMobile;
    this.isCollapsed = isMobile; // Colapsa automáticamente en móviles
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  public get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  public get isJournalist(): boolean {
    return this.authService.isJournalist();
  }

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;

    // En móviles, mantenemos visibilidad del botón flotante
    if (window.innerWidth <= 768) {
      this.showToggleButton = true;
    } else {
      this.showToggleButton = !this.isCollapsed;
    }
  }
}
