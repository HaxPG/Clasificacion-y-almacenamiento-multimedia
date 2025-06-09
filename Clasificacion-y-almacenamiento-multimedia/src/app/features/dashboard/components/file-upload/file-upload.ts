// src/app/features/dashboard/components/file-upload/file-upload.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { FileService } from '../../../../core/services/file';
import { CategoryService } from '../../../../core/services/category';
import { TagService } from '../../../../core/services/tag';
import { CollectionService } from '../../../../core/services/collection';
import { SectionService } from '../../../../core/services/section';
import { Category } from '../../../../shared/models/category';
import { Tag } from '../../../../shared/models/tag';
import { Collection } from '../../../../shared/models/collection';
import { Section } from '../../../../shared/models/section';
import { forkJoin, Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { HttpEventType, HttpResponse } from '@angular/common/http'; // Importar para manejar el progreso

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.html',
  styleUrls: ['./file-upload.css'],
  imports: [CommonModule, ReactiveFormsModule],
  standalone: true,
})
export class FileUploadComponent implements OnInit {
  fileUploadForm!: FormGroup;
  selectedFile: File | null = null;
  errorMessage: string = '';
  successMessage: string = '';
  uploadProgress: number = 0; // Para mostrar el progreso

  categories: Category[] = [];
  tags: Tag[] = [];
  collections: Collection[] = [];
  sections: Section[] = [];

  constructor(
    private fb: FormBuilder,
    private fileService: FileService,
    private categoryService: CategoryService,
    private tagService: TagService,
    private collectionService: CollectionService,
    private sectionService: SectionService
  ) {}

  ngOnInit(): void {
    this.fileUploadForm = this.fb.group({
      tipo: ['documento', Validators.required],
      fuente: [''],
      lugar_captura: [''],
      fecha_captura: [''], // Formato 'yyyy-MM-dd' para input type="date"
      derechos_uso: [''],
      nivel_acceso: ['público', Validators.required],
      id_categoria: [null], // Puede ser opcional, por eso [null]
      tags: [[]], // Array de IDs de tags (se seleccionan múltiples)
      colecciones: [[]], // Array de IDs de colecciones (se seleccionan múltiples)
      secciones: [[]], // Array de IDs de secciones (se seleccionan múltiples)
    });

    this.loadMetadata();
  }

  loadMetadata(): void {
    forkJoin([
      this.categoryService.getCategories(),
      this.tagService.getTags(),
      this.collectionService.getCollections(),
      this.sectionService.getSections()
    ]).subscribe({
      next: ([categories, tags, collections, sections]) => {
        this.categories = categories;
        this.tags = tags;
        this.collections = collections;
        this.sections = sections;
        console.log('Metadata loaded:', { categories, tags, collections, sections });
      },
      error: (err) => {
        console.error('Error loading metadata:', err);
        this.errorMessage = 'Error al cargar datos adicionales para el formulario.';
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      // Determinar el tipo de archivo automáticamente
      const mimeType = this.selectedFile.type;
      let detectedType = 'documento';
      if (mimeType.startsWith('image/')) {
        detectedType = 'imagen';
      } else if (mimeType.startsWith('video/')) {
        detectedType = 'video';
      } else if (mimeType.startsWith('audio/')) {
        detectedType = 'audio';
      }
      this.fileUploadForm.patchValue({ tipo: detectedType });
    } else {
      this.selectedFile = null;
    }
    // Reiniciar mensajes de estado
    this.errorMessage = '';
    this.successMessage = '';
    this.uploadProgress = 0;
  }

  onSubmit(): void {
    if (this.fileUploadForm.valid && this.selectedFile) {
      this.errorMessage = '';
      this.successMessage = '';
      this.uploadProgress = 0;

      const formData = new FormData();
      // ¡¡CORRECCIÓN AQUÍ!! Cambia 'file' por 'archivo' para que coincida con Multer en el backend
      formData.append('archivo', this.selectedFile, this.selectedFile.name);

      Object.keys(this.fileUploadForm.value).forEach(key => {
        const value = this.fileUploadForm.get(key)?.value;
        if (key !== 'archivo' && value !== null && value !== undefined) {
          // Si el valor es un array (para tags, colecciones, secciones), lo convertimos a JSON string
          // para enviarlo como un único string al backend.
          // Tu backend deberá parsear estos strings JSON de vuelta a arrays.
          if (Array.isArray(value)) {
            // Es crucial que el backend maneje estos arrays como JSON strings,
            // o que la lógica en el backend se adapte a cómo Multer parsea múltiples valores
            // de un mismo campo (ej. formData.append('tags', tag1); formData.append('tags', tag2);)
            // Si el backend espera un array de IDs, envíalo como un string JSON
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, value);
          }
        }
      });

      this.fileService.uploadFile(formData).subscribe({
        next: (event) => {
          if (event.type === HttpEventType.UploadProgress) {
            this.uploadProgress = Math.round((100 * event.loaded) / (event.total || 1));
          } else if (event instanceof HttpResponse) {
            this.successMessage = 'Archivo subido exitosamente!';
            if (event.body && event.body.filename) {
                this.successMessage += `: ${event.body.filename}`;
            }
            this.errorMessage = '';
            this.resetForm();
            console.log('File upload response:', event.body);
          }
        },
        error: (err) => {
          this.uploadProgress = 0;
          this.errorMessage = err.error?.error || 'Error al subir el archivo. Inténtalo de nuevo.';
          this.successMessage = '';
          console.error('Upload error:', err);
        }
      });
    } else {
      this.errorMessage = 'Por favor, selecciona un archivo y completa todos los campos requeridos.';
      this.fileUploadForm.markAllAsTouched();
    }
  }

  resetForm(): void {
    this.fileUploadForm.reset({
      tipo: 'documento',
      fuente: '',
      lugar_captura: '',
      fecha_captura: '',
      derechos_uso: '',
      nivel_acceso: 'público',
      id_categoria: null,
      tags: [],
      colecciones: [],
      secciones: [],
    });
    this.selectedFile = null;
    const fileInput = document.getElementById('archivo') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    this.uploadProgress = 0;
  }
}