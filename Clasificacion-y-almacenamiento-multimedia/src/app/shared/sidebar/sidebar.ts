import { Component } from '@angular/core';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css']
})
export class SidebarComponent {
  // Controla si la barra lateral está colapsada o expandida
  isCollapsed = false;

  // Alterna el estado de colapso de la barra lateral
  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
  }
}
