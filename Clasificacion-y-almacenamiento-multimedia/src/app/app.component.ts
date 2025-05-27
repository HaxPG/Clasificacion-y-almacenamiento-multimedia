import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { SidebarComponent } from './shared/sidebar/sidebar.component';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, SidebarComponent],
  template: `
    <app-navbar></app-navbar>
    <div class="app-layout">
      <app-sidebar></app-sidebar>
      <main class="app-main">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app-layout {
      display: flex;
    }

    .app-main {
      margin-left: 60px; /* igual al ancho del sidebar */
      padding-top: 60px;  /* igual a la altura del navbar */
      width: 100%;
      min-height: 100vh;
      background-color: #f8f9fb;
    }
  `]
})
export class AppComponent {}
