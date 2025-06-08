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
  currentUser$: Observable<User | null>;

  isCollapsed = false;
  showToggleButton = false;

  constructor(private authService: AuthService, private router: Router) {
    this.currentUser$ = this.authService.user$;
  }

  ngOnInit(): void {}

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
    if (!this.isCollapsed) {
      // Se va a cerrar la barra
      this.showToggleButton = false;
      this.isCollapsed = true;

      // Mostrar botón ☰ luego de animación (300ms)
      setTimeout(() => {
        this.showToggleButton = true;
      }, 300);
    } else {
      // Se va a abrir la barra
      this.isCollapsed = false;
      this.showToggleButton = false;
    }
  }
}
