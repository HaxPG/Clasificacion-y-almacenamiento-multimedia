import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './favorites.component.html',
  styleUrls: ['./gallery.component.css'] // Reutiliza el mismo CSS
})
export class FavoritesComponent implements OnInit {

  favorites: any[] = [];

  ngOnInit(): void {
    const data = localStorage.getItem('favoritos');
    if (data) {
      this.favorites = JSON.parse(data).filter((item: any) => item.isSaved);
    }
  }
}
