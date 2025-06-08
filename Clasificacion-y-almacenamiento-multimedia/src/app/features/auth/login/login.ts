// src/app/features/auth/login/login.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'; // Importar ReactiveFormsModule
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth';
import { CommonModule } from '@angular/common'; // Importar CommonModule



@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
  imports: [CommonModule,ReactiveFormsModule],
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
      contraseña: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.authService.login(this.loginForm.value).subscribe({
        next: (response) => {
          if (response && response.token) {
            this.router.navigate(['/dashboard']); // Redirigir al dashboard
          } else {
            this.errorMessage = 'Credenciales inválidas o error desconocido.';
          }
        },
        error: (err) => {
          this.errorMessage = err.error?.error || 'Error al iniciar sesión. Inténtalo de nuevo.';
          console.error('Login error:', err);
        }
      });
    } else {
      this.errorMessage = 'Por favor, completa todos los campos correctamente.';
    }
  }
}