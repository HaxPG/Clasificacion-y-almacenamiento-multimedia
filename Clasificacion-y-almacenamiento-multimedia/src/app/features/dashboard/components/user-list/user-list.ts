// src/app/features/dashboard/components/user-list/user-list.component.ts
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
  imports: [CommonModule]
})
export class UserListComponent implements OnInit {
  users$: Observable<User[]> | undefined;
  errorMessage: string = '';

  constructor(private userService: UserService) { }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.users$ = this.userService.getUsers().pipe(
      catchError(err => {
        this.errorMessage = 'Error al cargar usuarios. No tienes permisos o hay un problema en el servidor.';
        console.error('Error fetching users:', err);
        return of([]); // Retorna un observable vacío en caso de error
      })
    );
  }
}