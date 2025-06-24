// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { AuthGuard } from './core/auth/auth-guard';
import { LoginComponent } from './features/auth/login/login';
import { RegisterComponent } from './features/auth/register/register';
import { UploadComponent } from './pages/upload/upload.component';

export const routes: Routes = [
  // Redirección base hacia el dashboard
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  // Ruta pública para login
  { path: 'login', component: LoginComponent },

  // Registro protegido solo para administradores
  {
    path: 'register',
    component: RegisterComponent,
    canActivate: [AuthGuard],
    data: { roles: ['Administrador'] }
  },

  // Ruta principal protegida con rutas hijas
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/pages/home/home').then(m => m.HomeComponent),
    canActivate: [AuthGuard],
    children: [
      // Gestión de usuarios (solo administradores)
      {
        path: 'usuarios',
        loadComponent: () => import('./features/dashboard/components/user-list/user-list').then(m => m.UserListComponent),
        canActivate: [AuthGuard],
        data: { roles: ['Administrador'] }
      },
      // Subida de archivos (administradores y periodistas)
      {
        path: 'subir-archivo',
        loadComponent: () => import('./features/dashboard/components/file-upload/file-upload').then(m => m.FileUploadComponent),
        canActivate: [AuthGuard],
        data: { roles: ['Administrador', 'Periodista'] }
      },
      // Listado de archivos (acceso general autenticado)
      {
        path: 'archivos',
        loadComponent: () => import('./features/dashboard/components/file-list/file-list').then(m => m.FileListComponent),
        canActivate: [AuthGuard]
      },
      // Redirección por defecto dentro de dashboard
      { path: '', redirectTo: 'archivos', pathMatch: 'full' }
    ]
  },

  // Redirección para rutas no reconocidas
  { path: '**', redirectTo: 'dashboard' }
];
