import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { EMPTY, catchError, throwError } from 'rxjs';
import { API_URL, AuthService } from '../services/auth.service';

/** Adds the login token to API requests. If the server rejects it with a 401, the user is signed out. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();
  if (!token || !req.url.startsWith(API_URL)) {
    return next(req);
  }
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.startsWith(`${API_URL}/auth`)) {
        auth.logout();
        return EMPTY;
      }
      return throwError(() => error);
    })
  );
};
