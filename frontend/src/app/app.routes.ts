import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './guards/auth.guard';
import { Dashboard } from './pages/dashboard/dashboard';
import { Instructors } from './pages/instructors/instructors';
import { Login } from './pages/login/login';

export const routes: Routes = [
  { path: '', component: Login, pathMatch: 'full', canActivate: [guestGuard] },
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
  { path: 'instructors', component: Instructors, canActivate: [authGuard] },
  { path: '**', redirectTo: '' },
];
