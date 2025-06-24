// src/app/features/dashboard/components/file-upload/file-upload.component.ts

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { FileService } from '../../../../core/services/file';
import { CategoryService } from '../../../../core/services/category';
import { TagService } from '../../../../core/services/tag';
import { CollectionService } from '../../../../core/services/collection';
import { SectionService } from '../../../../core/services/section';
import { Category } from '../../../../shared/models/category';
import { Tag } from '../../../../shared/models/tag';
import { Collection } from '../../../../shared/models/collection';
import { Section } from '../../../../shared/models/section';
import { forkJoin } from 'rxjs';
import { CommonModule } from '@angular/common';
import { HttpEventType, HttpResponse } from '@angular/common/http';

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
  uploadProgress: number = 0;

  // Arreglos que almacenan los metadatos cargados para el formulario
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
    // Inicialización del formulario reactivo
    this.fileUploadForm = this.fb.group({
      titulo_archivo: ['', Validators.required],
      tipo: ['documento', Validators.required],
      fuente: [''],
      lugar_captura: [''],
      fecha_captura: [''],
      derechos_uso: [''],
      nivel_acceso: ['público', Validators.required],
      id_categoria: [null],
      tags: this.fb.array([]),
      colecciones: this.fb.array([]),
      secciones: this.fb.array([]),
    });

    // Carga de metadatos desde los servicios
    this.loadMetadata();
  }

  // Carga simultánea de categorías, tags, colecciones y secciones usando forkJoin
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

  // Maneja la selección del archivo y ajusta valores automáticamente
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];

      // Detección automática del tipo de archivo
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

      // Sugerencia automática de título (sin extensión)
      const fileNameWithoutExtension = this.selectedFile.name.split('.').slice(0, -1).join('.');
      this.fileUploadForm.patchValue({ titulo_archivo: fileNameWithoutExtension });

    } else {
      // Si se deselecciona el archivo
      this.selectedFile = null;
      this.fileUploadForm.patchValue({ titulo_archivo: '' });
    }

    // Reinicia los mensajes y progreso de carga
    this.errorMessage = '';
    this.successMessage = '';
    this.uploadProgress = 0;
  }

  // Manejo dinámico de checkboxes para tags, colecciones y secciones
  onCheckboxChange(id: number, formArrayName: 'tags' | 'colecciones' | 'secciones', event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const formArray = this.fileUploadForm.get(formArrayName) as FormArray;

    if (checked) {
      formArray.push(this.fb.control(id));
    } else {
      const index = formArray.controls.findIndex(control => control.value === id);
      if (index !== -1) {
        formArray.removeAt(index);
      }
    }
  }

  // Envía el formulario y el archivo al backend usando FormData
  onSubmit(): void {
    if (this.fileUploadForm.valid && this.selectedFile) {
      this.errorMessage = '';
      this.successMessage = '';
      this.uploadProgress = 0;

      const formData = new FormData();
      formData.append('archivo', this.selectedFile, this.selectedFile.name);

      // Recorre los campos del formulario y los agrega a FormData
      Object.keys(this.fileUploadForm.value).forEach(key => {
        const value = this.fileUploadForm.get(key)?.value;
        if (key !== 'archivo' && value !== null && value !== undefined) {
          if (Array.isArray(value)) {
            if (key === 'tags') {
              // Convierte los IDs de los tags en nombres antes de enviar
              const selectedTagIds = value as number[];
              const selectedTagNames = this.tags
                .filter(tag => selectedTagIds.includes(tag.id_tag))
                .map(tag => tag.nombre);
              formData.append(key, JSON.stringify(selectedTagNames));
            } else {
              // Para colecciones y secciones, se envían los IDs
              formData.append(key, JSON.stringify(value));
            }
          } else {
            formData.append(key, value);
          }
        }
      });

      // Realiza la solicitud de subida al backend
      this.fileService.uploadFile(formData).subscribe({
        next: (event) => {
          if (event.type === HttpEventType.UploadProgress) {
            // Actualiza el progreso de la carga
            this.uploadProgress = Math.round((100 * event.loaded) / (event.total || 1));
          } else if (event instanceof HttpResponse) {
            // Confirmación exitosa
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
      // Muestra error si faltan campos requeridos o no hay archivo seleccionado
      this.errorMessage = 'Por favor, selecciona un archivo y completa todos los campos requeridos.';
      this.fileUploadForm.markAllAsTouched();
    }
  }

  // Restablece el formulario y limpia todos los campos y checkboxes
  resetForm(): void {
    this.fileUploadForm.reset({
      titulo_archivo: '',
      tipo: 'documento',
      fuente: '',
      lugar_captura: '',
      fecha_captura: '',
      derechos_uso: '',
      nivel_acceso: 'público',
      id_categoria: null,
    });

    // Limpia manualmente los FormArrays
    (this.fileUploadForm.get('tags') as FormArray).clear();
    (this.fileUploadForm.get('colecciones') as FormArray).clear();
    (this.fileUploadForm.get('secciones') as FormArray).clear();

    this.selectedFile = null;

    // Limpia visualmente el input file
    const fileInput = document.getElementById('archivo') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }

    this.uploadProgress = 0;
  }
}
