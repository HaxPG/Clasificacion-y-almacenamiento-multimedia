// src/app/features/auth/login/login.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
  imports: [CommonModule, ReactiveFormsModule],
  standalone: true
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;            // Formulario reactivo de login
  errorMessage: string = '';        // Mensaje de error mostrado en la vista

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  /**
   * Inicializa el formulario con validaciones para correo y contraseña.
   * El campo 'contraseña' se define con 'ñ' para coincidir con el HTML.
   */
  ngOnInit(): void {
    this.loginForm = this.fb.group({
      correo: ['', [Validators.required, Validators.email]],
      contraseña: ['', Validators.required]
    });
  }

  /**
   * Maneja el envío del formulario. Si es válido, intenta iniciar sesión.
   * En caso de éxito, redirige al dashboard. En caso de error, muestra mensajes apropiados.
   */
  onSubmit(): void {
    if (this.loginForm.valid) {
      this.errorMessage = ''; // Limpia errores anteriores

      this.authService.login(this.loginForm.value).subscribe({
        next: (response) => {
          if (response && response.token) {
            console.log('Login successful:', response);
            this.router.navigate(['/dashboard']);
          } else {
            this.errorMessage = 'Credenciales inválidas o error desconocido.';
          }
        },
        error: (err) => {
          console.error('Login error:', err);
          // Muestra el mensaje de error devuelto por el servidor si está disponible
          this.errorMessage = err.error?.error || 'Error al iniciar sesión. Verifica tus credenciales.';
        }
      });

    } else {
      // Muestra errores de validación si el formulario está incompleto
      this.errorMessage = 'Por favor, completa todos los campos correctamente.';
      this.loginForm.markAllAsTouched();
    }
  }
}
