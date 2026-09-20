import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  imports: [MatButtonModule],
  template: `
    <p>Dashboard</p>
    <button mat-button type="button" (click)="auth.logout()">Log out</button>
  `,
})
export class Dashboard {
  protected readonly auth = inject(AuthService);
}
