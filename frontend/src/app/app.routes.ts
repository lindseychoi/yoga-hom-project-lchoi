import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { Dashboard } from './pages/dashboard/dashboard';
import { Login } from './pages/login/login';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: '', component: Dashboard, pathMatch: 'full', canActivate: [authGuard] },
  { path: '**', redirectTo: '' },
];
