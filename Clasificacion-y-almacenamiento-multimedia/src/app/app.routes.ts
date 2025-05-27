import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { UploadComponent } from './pages/upload/upload.component';
import { SearchComponent } from './pages/search/search.component';
import { PreviewComponent } from './pages/preview/preview.component';
import { AccessControlComponent } from './pages/access-control/access-control.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'upload', component: UploadComponent },
  { path: 'search', component: SearchComponent },
  { path: 'preview/:id', component: PreviewComponent },
  { path: 'access', component: AccessControlComponent },
];
