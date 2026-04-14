import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Decode a JWT and return parsed payload, or null if malformed */
function decodeToken(token: string): { exp?: number } | null {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

/** Returns true only if the token exists and has not expired */
function isTokenValid(token: string | null): boolean {
  if (!token) return false;
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return false;
  // exp is in seconds — compare against current time
  return decoded.exp * 1000 > Date.now();
}

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (isTokenValid(authService.token)) {
    return true;
  }

  // Token is absent or expired — clear stale data and redirect
  localStorage.removeItem('token');
  localStorage.removeItem('currentUser');
  router.navigate(['/login']);
  return false;
};

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (isTokenValid(authService.token) && authService.isAdmin) {
    return true;
  }

  // Token is absent/expired or user is not admin — redirect to login
  localStorage.removeItem('token');
  localStorage.removeItem('currentUser');
  router.navigate(['/login']);
  return false;
};
