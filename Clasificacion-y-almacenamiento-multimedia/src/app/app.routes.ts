// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { AuthGuard } from './core/auth/auth-guard'; // Importa la CLASE del guard
import { LoginComponent } from './features/auth/login/login';
import { RegisterComponent } from './features/auth/register/register';
import { UploadComponent } from './pages/upload/upload.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: 'register',
    component: RegisterComponent,
    canActivate: [AuthGuard], // <-- Aquí se usa la CLASE directamente
    data: { roles: ['Administrador'] }
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/pages/home/home').then(m => m.HomeComponent),
    canActivate: [AuthGuard], // <-- Aquí se usa la CLASE directamente
    children: [
      {
        path: 'usuarios',
        loadComponent: () => import('./features/dashboard/components/user-list/user-list').then(m => m.UserListComponent),
        canActivate: [AuthGuard],
        data: { roles: ['Administrador'] }
      },
      {
        path: 'subir-archivo',
        loadComponent: () => import('./features/dashboard/components/file-upload/file-upload').then(m => m.FileUploadComponent),
        canActivate: [AuthGuard],
        data: { roles: ['Administrador', 'Periodista'] }
      },
      {
        path: 'archivos',
        loadComponent: () => import('./features/dashboard/components/file-list/file-list').then(m => m.FileListComponent),
        canActivate: [AuthGuard]
      },
      { path: '', redirectTo: 'archivos', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];