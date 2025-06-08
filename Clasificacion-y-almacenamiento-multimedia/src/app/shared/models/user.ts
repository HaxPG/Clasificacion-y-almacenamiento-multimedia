// src/app/shared/models/user.model.ts
export interface User {
  id: number;
  nombre: string;
  correo: string;
  rol: 'Administrador' | 'Periodista' | 'Visualizador';
}