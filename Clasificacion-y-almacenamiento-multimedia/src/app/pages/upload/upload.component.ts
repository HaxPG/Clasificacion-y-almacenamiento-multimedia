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
  selectedFile!: File;
  id_categoria = '';
  nivel_acceso = 'público';
  categorias: any[] = [];
  uploading = false;
  uploadedUrl = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    const token = localStorage.getItem('token');
    if (!token) return;

    this.http.get<any[]>('http://localhost:3000/api/categorias', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }).subscribe({
      next: (res) => this.categorias = res,
      error: () => alert('Error al cargar categorías')
    });
  }

  onFileChange(event: any) {
    this.selectedFile = event.target.files[0];
  }

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
    formData.append('fuente', 'Subido manualmente');
    formData.append('tipo', 'imagen');

    this.uploading = true;
    this.http.post<any>('http://localhost:3000/api/archivos', formData, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (res) => {
        this.uploadedUrl = `http://localhost:3000/${res.path}`;
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
