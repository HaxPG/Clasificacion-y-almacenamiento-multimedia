// src/app/features/dashboard/components/file-upload/file-upload.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray, FormControl } from '@angular/forms';
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
      // NUEVO CAMPO: Título del archivo
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

      // Opcional: Sugerir el título del archivo desde el nombre del archivo seleccionado (sin extensión)
      const fileNameWithoutExtension = this.selectedFile.name.split('.').slice(0, -1).join('.');
      this.fileUploadForm.patchValue({ titulo_archivo: fileNameWithoutExtension });

    } else {
      this.selectedFile = null;
      this.fileUploadForm.patchValue({ titulo_archivo: '' }); // Limpiar si no hay archivo
    }
    // Reiniciar mensajes de estado
    this.errorMessage = '';
    this.successMessage = '';
    this.uploadProgress = 0;
  }

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

  onSubmit(): void {
    if (this.fileUploadForm.valid && this.selectedFile) {
      this.errorMessage = '';
      this.successMessage = '';
      this.uploadProgress = 0;

      const formData = new FormData();
      formData.append('archivo', this.selectedFile, this.selectedFile.name);

      Object.keys(this.fileUploadForm.value).forEach(key => {
        const value = this.fileUploadForm.get(key)?.value;
        if (key !== 'archivo' && value !== null && value !== undefined) {
          if (Array.isArray(value)) {
            // Para 'tags', queremos enviar los NOMBRES de los tags al backend, no los IDs
            if (key === 'tags') {
              const selectedTagIds = value as number[];
              const selectedTagNames = this.tags
                .filter(tag => selectedTagIds.includes(tag.id_tag))
                .map(tag => tag.nombre);
              formData.append(key, JSON.stringify(selectedTagNames)); // Enviar NOMBRES como JSON string
            } else {
              // Para 'colecciones' y 'secciones', seguimos enviando los IDs si el backend los espera
              formData.append(key, JSON.stringify(value)); // Enviar IDs como JSON string
            }
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
      titulo_archivo: '', // Restablecer el nuevo campo
      tipo: 'documento',
      fuente: '',
      lugar_captura: '',
      fecha_captura: '',
      derechos_uso: '',
      nivel_acceso: 'público',
      id_categoria: null,
    });
    // Limpiar FormArray manualmente
    (this.fileUploadForm.get('tags') as FormArray).clear();
    (this.fileUploadForm.get('colecciones') as FormArray).clear();
    (this.fileUploadForm.get('secciones') as FormArray).clear();

    this.selectedFile = null;
    const fileInput = document.getElementById('archivo') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    this.uploadProgress = 0;
  }
}