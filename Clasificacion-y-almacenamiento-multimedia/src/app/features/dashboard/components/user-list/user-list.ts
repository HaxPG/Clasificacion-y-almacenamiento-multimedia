import { Component, OnInit } from '@angular/core';
import { UserService } from '../../../../core/services/user';
import { User } from '../../../../shared/models/user';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.html',
  styleUrls: ['./user-list.css'],
  standalone: true, // Componente autónomo, no depende de un módulo Angular
  imports: [CommonModule]
})
export class UserListComponent implements OnInit {
  users$: Observable<User[]> | undefined; // Observable de usuarios
  errorMessage: string = ''; // Mensaje de error a mostrar si falla la carga

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadUsers(); // Cargar usuarios al inicializar el componente
  }

  // Llama al servicio para obtener usuarios y maneja errores
  loadUsers(): void {
    this.users$ = this.userService.getUsers().pipe(
      catchError(err => {
        this.errorMessage = 'Error al cargar usuarios. No tienes permisos o hay un problema en el servidor.';
        console.error('Error fetching users:', err);
        return of([]); // Retorna un array vacío para que la tabla no se rompa
      })
    );
  }

  // Acción al hacer clic en "Agregar Usuario"
  agregarUsuario(): void {
    // Aquí podrías abrir un modal o redirigir a un formulario
    console.log('Agregar usuario: abrir modal o redirigir');
  }

  // Acción al hacer clic en el botón "Editar"
  editarUsuario(user: User): void {
    // Aquí podrías abrir un modal con los datos del usuario
    console.log('Editar usuario:', user);
  }

  // Acción al hacer clic en el botón "Eliminar"
  eliminarUsuario(userId: number): void {
    if (confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      this.userService.deleteUser(userId).subscribe({
        next: () => {
          console.log(`Usuario con ID ${userId} eliminado.`);
          this.loadUsers(); // Recargar la lista después de eliminar
        },
        error: err => {
          console.error('Error eliminando usuario:', err);
          this.errorMessage = 'No se pudo eliminar el usuario.';
        }
      });
    }
  }
}
