// src/app/features/auth/login/login.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth'; // Asegúrate de que esta ruta sea correcta
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
  imports: [CommonModule, ReactiveFormsModule],
  standalone: true
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      correo: ['', [Validators.required, Validators.email]],
      // Usar 'contraseña' con 'ñ' para coincidir con tu HTML
      contraseña: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.errorMessage = ''; // Limpiar mensajes de error previos
      // Pasa el valor completo del formulario, como ya lo estabas haciendo
      this.authService.login(this.loginForm.value).subscribe({
        next: (response) => {
          if (response && response.token) {
            console.log('Login successful:', response);
            this.router.navigate(['/dashboard']); // Redirigir al dashboard
          } else {
            this.errorMessage = 'Credenciales inválidas o error desconocido.';
          }
        },
        error: (err) => {
          console.error('Login error:', err);
          this.errorMessage = err.error?.error || 'Error al iniciar sesión. Verifica tus credenciales.';
        }
      });
    } else {
      this.errorMessage = 'Por favor, completa todos los campos correctamente.';
      this.loginForm.markAllAsTouched(); // Marcar para mostrar errores de validación
    }
  }
}