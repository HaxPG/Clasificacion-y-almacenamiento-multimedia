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



@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.html',
  styleUrls: ['./file-upload.css'],
imports: [CommonModule, ReactiveFormsModule], // Importa CommonModule para usar ngIf, ngFor, etc.
  standalone: true, // Marca el componente como standalone
})
export class FileUploadComponent implements OnInit {
  fileUploadForm!: FormGroup;
  selectedFile: File | null = null;
  errorMessage: string = '';
  successMessage: string = '';

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
      archivo: [null, Validators.required],
      tipo: ['documento', Validators.required], // Valor por defecto
      fuente: [''],
      lugar_captura: [''],
      fecha_captura: [''], // Considerar un input tipo 'date'
      derechos_uso: [''],
      nivel_acceso: ['público', Validators.required],
      id_categoria: [null],
      tags: [[]], // Array de IDs de tags
      colecciones: [[]], // Array de IDs de colecciones
      secciones: [[]], // Array de IDs de secciones
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
      },
      error: (err) => {
        console.error('Error loading metadata:', err);
        this.errorMessage = 'Error al cargar datos adicionales para el formulario.';
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.fileUploadForm.patchValue({
        archivo: file
      });
      // Intentar determinar el tipo de archivo automáticamente
      const mimeType = file.type;
      let detectedType = 'documento';
      if (mimeType.startsWith('image/')) {
        detectedType = 'imagen';
      } else if (mimeType.startsWith('video/')) {
        detectedType = 'video';
      } else if (mimeType.startsWith('audio/')) {
        detectedType = 'audio';
      }
      this.fileUploadForm.patchValue({ tipo: detectedType });
    }
  }

  onSubmit(): void {
    if (this.fileUploadForm.valid && this.selectedFile) {
      this.errorMessage = '';
      this.successMessage = '';

      const formData = new FormData();
      formData.append('archivo', this.selectedFile, this.selectedFile.name);

      // Añadir otros campos
      Object.keys(this.fileUploadForm.value).forEach(key => {
        const value = this.fileUploadForm.get(key)?.value;
        if (key !== 'archivo' && value !== null && value !== undefined) {
          if (Array.isArray(value)) {
            formData.append(key, JSON.stringify(value)); // Convertir arrays a JSON string
          } else {
            formData.append(key, value);
          }
        }
      });

      this.fileService.uploadFile(formData).subscribe({
        next: (response) => {
          this.successMessage = 'Archivo subido exitosamente: ' + response.filename;
          this.errorMessage = '';
          this.fileUploadForm.reset();
          this.selectedFile = null;
          // Reiniciar valores por defecto
          this.fileUploadForm.patchValue({
            tipo: 'documento',
            nivel_acceso: 'público',
            tags: [],
            colecciones: [],
            secciones: []
          });
        },
        error: (err) => {
          this.errorMessage = err.error?.error || 'Error al subir el archivo. Inténtalo de nuevo.';
          this.successMessage = '';
          console.error('Upload error:', err);
        }
      });
    } else {
      this.errorMessage = 'Por favor, selecciona un archivo y completa todos los campos requeridos.';
    }
  }
}