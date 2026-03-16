import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface User {
  id: number;
  username: string;
  name: string;
  role: 'admin' | 'staff';
  branchId?: number;
  branchName?: string;
  empId?: number;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      this.currentUserSubject.next(JSON.parse(stored));
    }
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get token(): string | null {
    return localStorage.getItem('token');
  }

  get isLoggedIn(): boolean {
    return !!this.token;
  }

  get isAdmin(): boolean {
    return this.currentUser?.role === 'admin';
  }

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, { username, password })
      .pipe(tap(res => this.handleLogin(res)));
  }

  changePassword(oldPassword: string, newPassword: string): Observable<any> {
    const endpoint = this.isAdmin ? 'change-admin-password' : 'change-staff-password';
    return this.http.post(`${environment.apiUrl}/auth/${endpoint}`, { oldPassword, newPassword });
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  private handleLogin(res: LoginResponse): void {
    localStorage.setItem('token', res.token);
    localStorage.setItem('currentUser', JSON.stringify(res.user));
    this.currentUserSubject.next(res.user);
  }
}
