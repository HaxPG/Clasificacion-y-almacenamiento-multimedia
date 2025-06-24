// src/app/features/auth/register/register.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
  imports: [CommonModule, ReactiveFormsModule],
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;          // Formulario de registro reactivo
  errorMessage: string = '';         // Mensaje de error mostrado en la vista
  successMessage: string = '';       // Mensaje de éxito mostrado en la vista
  roles = ['Administrador', 'Periodista', 'Visualizador']; // Roles permitidos

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  /**
   * Inicializa el formulario con validaciones.
   * Todos los campos son requeridos, y la contraseña tiene mínimo 6 caracteres.
   */
  ngOnInit(): void {
    this.registerForm = this.fb.group({
      nombre: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email]],
      contraseña: ['', [Validators.required, Validators.minLength(6)]],
      rol: ['', Validators.required]
    });
  }

  /**
   * Maneja el envío del formulario de registro.
   * Si es válido, intenta registrar el usuario mediante AuthService.
   * En caso de éxito, muestra un mensaje y limpia el formulario.
   * En caso de error, muestra un mensaje correspondiente.
   */
  onSubmit(): void {
    if (this.registerForm.valid) {
      this.authService.register(this.registerForm.value).subscribe({
        next: (response) => {
          this.successMessage = response.message || 'Usuario registrado exitosamente.';
          this.errorMessage = '';
          this.registerForm.reset(); // Limpia el formulario después del registro exitoso

          // Redirección opcional tras registro exitoso:
          // this.router.navigate(['/usuarios']);
        },
        error: (err) => {
          this.errorMessage = err.error?.error || 'Error al registrar usuario. Inténtalo de nuevo.';
          this.successMessage = '';
          console.error('Register error:', err);
        }
      });

    } else {
      // Mostrar mensaje si hay campos inválidos
      this.errorMessage = 'Por favor, completa todos los campos correctamente.';
      this.successMessage = '';
    }
  }
}
