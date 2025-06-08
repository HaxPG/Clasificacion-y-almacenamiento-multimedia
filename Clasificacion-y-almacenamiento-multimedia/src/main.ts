import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes'; // Usaremos app.routes.ts para las rutas
import { tokenInterceptor } from './app/core/auth/token.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes), // Configura las rutas
    provideHttpClient(withInterceptors([tokenInterceptor]), withFetch()), // Configura HttpClient con el interceptor funcional y fetch
    // AuthService ya está proveído con providedIn: 'root', no es necesario aquí.
    // También podrías proveer otros servicios globales aquí, ej: UserService
  ]
}).catch(err => console.error(err));
