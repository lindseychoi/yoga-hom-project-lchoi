import { Routes } from '@angular/router';
import { authGuard, guestGuard, managerGuard } from './guards/auth.guard';
import { Attendance } from './pages/attendance/attendance';
import { Classes } from './pages/classes/classes';
import { Customers } from './pages/customers/customers';
import { Dashboard } from './pages/dashboard/dashboard';
import { Instructors } from './pages/instructors/instructors';
import { Login } from './pages/login/login';
import { Packages } from './pages/packages/packages';
import { Reports } from './pages/reports/reports';
import { Sales } from './pages/sales/sales';

/** The login page at the root. Every other page needs a login. */
export const routes: Routes = [
  { path: '', component: Login, pathMatch: 'full', canActivate: [guestGuard] },
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
  { path: 'instructors', component: Instructors, canActivate: [authGuard, managerGuard] },
  { path: 'customers', component: Customers, canActivate: [authGuard, managerGuard] },
  { path: 'packages', component: Packages, canActivate: [authGuard, managerGuard] },
  { path: 'sales', component: Sales, canActivate: [authGuard, managerGuard] },
  { path: 'attendance', component: Attendance, canActivate: [authGuard] },
  { path: 'reports', component: Reports, canActivate: [authGuard] },
  { path: 'classes', component: Classes, canActivate: [authGuard] },
  { path: '**', redirectTo: '' },
];
