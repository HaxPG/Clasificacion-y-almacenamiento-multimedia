import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css']
})
export class UploadComponent implements OnInit {
  selectedFile!: File;                  // Archivo seleccionado por el usuario
  id_categoria = '';                    // ID de la categoría seleccionada
  nivel_acceso = 'público';             // Nivel de acceso por defecto
  categorias: any[] = [];               // Lista de categorías disponibles
  uploading = false;                    // Bandera para mostrar estado de carga
  uploadedUrl = '';                     // URL del archivo subido exitosamente

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Carga las categorías desde la API al iniciar el componente
    this.http.get<any[]>('http://localhost:3000/api/categorias', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }).subscribe({
      next: (res) => this.categorias = res,  // Asigna categorías recibidas
      error: () => alert('Error al cargar categorías')  // Muestra error si falla la solicitud
    });
  }

  // Maneja el evento de cambio de archivo (input type="file")
  onFileChange(event: any) {
    this.selectedFile = event.target.files[0];
  }

  // Envía el archivo al backend junto con los metadatos requeridos
  upload() {
    const token = localStorage.getItem('token');
    if (!token || !this.selectedFile || !this.id_categoria) {
      alert('Faltan datos requeridos.');
      return;
    }

    const formData = new FormData();
    formData.append('archivo', this.selectedFile);
    formData.append('id_categoria', this.id_categoria);
    formData.append('nivel_acceso', this.nivel_acceso);
    formData.append('fuente', 'Subido manualmente');  // Fuente predefinida
    formData.append('tipo', 'imagen');                // Tipo predefinido

    this.uploading = true;

    // Realiza la solicitud POST para subir el archivo
    this.http.post<any>('http://localhost:3000/api/archivos', formData, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (res) => {
        this.uploadedUrl = `http://localhost:3000/${res.path}`;  // Construye la URL del archivo
        this.uploading = false;
        alert('Archivo subido con éxito.');
      },
      error: (err) => {
        this.uploading = false;
        console.error(err);
        alert('Error al subir archivo');
      }
    });
  }
}
