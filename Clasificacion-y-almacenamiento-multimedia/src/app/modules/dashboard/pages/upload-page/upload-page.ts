import { Component } from '@angular/core';
import { FileUploadComponent } from '../../../../features/dashboard/components/file-upload/file-upload'; // Ajusta la ruta
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-upload-page',
  standalone: true,
  imports: [FileUploadComponent, CommonModule], // Importa el componente
  template: `
    <div class="upload-container">
      <h2>Subir Nuevo Archivo</h2>
      <app-file-upload (fileUploaded)="onFileUploaded($event)"></app-file-upload>
      <div *ngIf="uploadSuccessMessage" class="success-message">
        {{ uploadSuccessMessage }}
      </div>
      <div *ngIf="uploadErrorMessage" class="error-message">
        {{ uploadErrorMessage }}
      </div>
    </div>
  `,
  styles: [`
    .upload-container {
      padding: 20px;
      max-width: 600px;
      margin: 20px auto;
      background-color: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .success-message {
      color: green;
      margin-top: 15px;
    }
    .error-message {
      color: red;
      margin-top: 15px;
    }
  `]
})
export class UploadPageComponent {
  uploadSuccessMessage: string | null = null;
  uploadErrorMessage: string | null = null;

  onFileUploaded(response: any) {
    if (response.success) {
      this.uploadSuccessMessage = 'Archivo subido exitosamente: ' + response.filename;
      this.uploadErrorMessage = null;
      console.log('Archivo subido con éxito:', response.data);
      // Aquí podrías redirigir al usuario, actualizar una lista de archivos, etc.
    } else {
      this.uploadErrorMessage = 'Error al subir el archivo: ' + response.error;
      this.uploadSuccessMessage = null;
      console.error('Error al subir archivo:', response.error);
    }
  }
}