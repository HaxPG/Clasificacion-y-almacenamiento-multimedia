import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing'; // Añade esto para probar servicios HTTP
import { AuthService } from './auth'; // Asegúrate de que la ruta sea correcta

describe('AuthService', () => { // Cambia la descripción del describe
  let service: AuthService; // Tipo corregido

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule], // Importa para dependencias HTTP
      providers: [AuthService] // Provee el servicio que estás probando
    });
    service = TestBed.inject(AuthService); // Inyección corregida
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});