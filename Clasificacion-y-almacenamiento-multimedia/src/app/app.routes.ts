import { Routes } from '@angular/router';
import { GalleryComponent } from './pages/gallery.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { UploadComponent } from './pages/upload/upload.component';
import { SearchComponent } from './pages/search/search.component';
import { PreviewComponent } from './pages/preview/preview.component';
import { AccessControlComponent } from './pages/access-control/access-control.component';
import { FavoritesComponent } from './pages/favorites.component';

export const routes: Routes = [
  { path: '', component: GalleryComponent },
  { path: 'upload', component: UploadComponent },
  { path: 'search', component: SearchComponent },
  { path: 'preview/:id', component: PreviewComponent },
  { path: 'access', component: AccessControlComponent },
  { path: 'favorites', component: FavoritesComponent },
  
];
