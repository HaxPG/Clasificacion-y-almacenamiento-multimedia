import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  standalone: true,
  template: `
    <h1>Bienvenido al Sistema de Clasificación y Almacenamiento Multimedia</h1>
    <p>Utiliza el menú para navegar entre las secciones.</p>
  `,
  styles: [`
    h1 {
      font-size: 2rem;
      margin-bottom: 1rem;
    }
  `]
})
export class HomeComponent {}
