// src/app/features/dashboard/pages/home/home.component.ts
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
  imports: [RouterLink, RouterModule, CommonModule]
  

})
export class HomeComponent implements OnInit {
  currentUser$: Observable<User | null>;

  constructor(private authService: AuthService, private router: Router) {
    this.currentUser$ = this.authService.user$;
  }

  ngOnInit(): void {
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
}