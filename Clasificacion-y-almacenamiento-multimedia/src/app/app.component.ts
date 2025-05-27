import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule],
  template: `
    <nav>
      <a routerLink="/">Home</a>
      <a routerLink="/dashboard">Dashboard</a>
      <a routerLink="/upload">Upload</a>
      <a routerLink="/search">Search</a>
    </nav>
    <router-outlet></router-outlet>
  `
})
export class AppComponent {}
