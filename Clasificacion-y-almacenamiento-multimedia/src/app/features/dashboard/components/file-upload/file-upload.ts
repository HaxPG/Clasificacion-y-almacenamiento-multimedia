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
      // No necesitamos un FormControl para 'archivo' si solo lo manejamos con selectedFile y validación manual
      // Si quieres mantener la validación 'required' con Reactive Forms para el input type="file",
      // la forma más robusta es crear un FormControl separado que solo valide la presencia del archivo
      // y luego adjuntarlo manualmente al FormData.
      // Por ahora, lo dejaremos como está en tu HTML, pero el manejo del 'archivo' se hará vía 'selectedFile'.
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
      // Para la validación 'archivo' en el formulario reactivo
      // Puedes simular que el campo 'archivo' está lleno si tienes un FormControl para ello
      // Si no tienes un FormControl para 'archivo', la validación del HTML no funcionará
      // La mejor práctica es manejar la validación del archivo fuera del FormGroup principal
      // o con un FormControl que sea un 'Blob' o 'File'.
      // Para este caso, si fileUploadForm.get('archivo') es nulo, este patchValue no funcionará,
      // pero la lógica de 'selectedFile' sigue siendo válida para el envío.
      // Si el `formControlName="archivo"` realmente existe, esto es correcto:
      // this.fileUploadForm.get('archivo')?.setValue(this.selectedFile);

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
      // this.fileUploadForm.get('archivo')?.setValue(null); // Si tenías un FormControl para el archivo
    }
    // Reiniciar mensajes de estado
    this.errorMessage = '';
    this.successMessage = '';
    this.uploadProgress = 0;
  }

  onSubmit(): void {
    // Asegurarse de que el formulario es válido Y que un archivo ha sido seleccionado
    if (this.fileUploadForm.valid && this.selectedFile) {
      this.errorMessage = '';
      this.successMessage = '';
      this.uploadProgress = 0;

      const formData = new FormData();
      formData.append('file', this.selectedFile, this.selectedFile.name); // 'file' es el nombre que el backend espera para el archivo

      // Añadir otros campos del formulario
      Object.keys(this.fileUploadForm.value).forEach(key => {
        const value = this.fileUploadForm.get(key)?.value;
        // Excluir 'archivo' si fuera un FormControl
        if (key !== 'archivo' && value !== null && value !== undefined) {
          // Si el valor es un array (para tags, colecciones, secciones), lo adjuntamos uno por uno
          // Esto es más común si el backend usa multer o similar para procesar arrays de IDs
          if (Array.isArray(value)) {
            value.forEach((item: any) => formData.append(key, item.toString()));
          } else {
            formData.append(key, value);
          }
        }
      });

      this.fileService.uploadFile(formData).subscribe({
        next: (event) => {
          // Manejar el progreso de la subida
          if (event.type === HttpEventType.UploadProgress) {
            this.uploadProgress = Math.round((100 * event.loaded) / (event.total || 1));
          } else if (event instanceof HttpResponse) {
            // Cuando la subida se ha completado y se recibe la respuesta final
            this.successMessage = 'Archivo subido exitosamente!';
            // La respuesta de tu backend debería tener 'filename' como propiedad
            if (event.body && event.body.filename) {
                this.successMessage += `: ${event.body.filename}`;
            }
            this.errorMessage = '';
            this.resetForm(); // Limpiar el formulario y el archivo seleccionado
            console.log('File upload response:', event.body);
            // Opcional: Podrías redirigir al usuario, por ejemplo, a la lista de archivos
            // this.router.navigate(['/dashboard/files']);
          }
        },
        error: (err) => {
          this.uploadProgress = 0; // Resetear progreso en caso de error
          this.errorMessage = err.error?.error || 'Error al subir el archivo. Inténtalo de nuevo.';
          this.successMessage = '';
          console.error('Upload error:', err);
        }
      });
    } else {
      this.errorMessage = 'Por favor, selecciona un archivo y completa todos los campos requeridos.';
      // Marcar todos los controles como 'touched' para mostrar los errores de validación
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
    // Necesitas resetear el input type="file" manualmente si no tiene formControlName directo
    const fileInput = document.getElementById('archivo') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = ''; // Limpiar el valor del input file
    }
    this.uploadProgress = 0;
  }
}