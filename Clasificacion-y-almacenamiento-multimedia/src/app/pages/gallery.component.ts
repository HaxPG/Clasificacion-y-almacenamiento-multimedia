import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import { Inject, PLATFORM_ID } from '@angular/core';


@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.css']
})
export class GalleryComponent implements OnInit {
  selectedCategory = 'Todos';
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

downloadImage(imageUrl: string, title: string) {
  fetch(imageUrl)
    .then(response => response.blob())
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/\s+/g, '_')}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    })
    .catch(error => console.error('Error al descargar la imagen:', error));
}
  items = [
    {
      title: 'Diseño elegante',
      category: 'Interior',
      img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=60',
      isSaved: false
    },
    {
      title: 'Estilo urbano',
      category: 'Moda',
      img: 'https://images.unsplash.com/photo-1533106418989-88406c7cc8e1?auto=format&fit=crop&w=800&q=60',
      isSaved: false
    },
    {
      title: 'Rascacielos moderno',
      category: 'Arquitectura',
      img: 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=800&q=60',
      isSaved: false
    },
    {
      title: 'Viaje a la montaña',
      category: 'Naturaleza',
      img: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=60',
      isSaved: false
    },
    {
      title: 'Retrato artístico',
      category: 'Fotografía', 
      img: 'https://images.unsplash.com/photo-1504198453319-5ce911bafcde?auto=format&fit=crop&w=800&q=60',
      isSaved: false
    }
  ];

  get filteredItems() {
    if (this.selectedCategory === 'Todos') return this.items;
    return this.items.filter(item => item.category === this.selectedCategory);
  }

  selectCategory(cat: string) {
    this.selectedCategory = cat;
  }

  toggleSave(index: number) {
    this.filteredItems[index].isSaved = !this.filteredItems[index].isSaved;
    localStorage.setItem('favoritos', JSON.stringify(this.items));
  }

  ngOnInit(): void {
  if (isPlatformBrowser(this.platformId)) {
    const saved = localStorage.getItem('favoritos');
    if (saved) {
      this.items = JSON.parse(saved);
    }
  }
}
}
