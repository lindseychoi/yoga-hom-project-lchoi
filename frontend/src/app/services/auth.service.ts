import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { LoginResponse, Role } from '../models/user.model';

/** Base path for every API call. */
export const API_URL = '/api/v1';
const TOKEN_KEY = 'yogitrack.token';
const ROLE_KEY = 'yogitrack.role';

/** Keeps the login state (token, role) in the browser and in signals, and calls the login API. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  private readonly token = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  readonly role = signal<Role | null>(localStorage.getItem(ROLE_KEY) as Role | null);
  readonly isLoggedIn = computed(() => this.token() !== null);

  /** Sends the credentials, and saves the token and role when the server accepts them. */
  login(email: string, password: string) {
    return this.http.post<LoginResponse>(`${API_URL}/auth/login`, { email, password }).pipe(
      tap(({ token, user }) => {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(ROLE_KEY, user.role);
        this.token.set(token);
        this.role.set(user.role);
      })
    );
  }

  getToken() {
    return this.token();
  }

  /** Clears the saved login, closes any open dialogs, and returns to the login page. */
  logout() {
    this.dialog.closeAll();
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
    this.token.set(null);
    this.role.set(null);
    this.router.navigate(['/']);
  }
}
