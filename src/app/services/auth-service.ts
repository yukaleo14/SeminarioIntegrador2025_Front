import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../environments/environment';
import { Rol } from '../models/Rol';

export interface LoginDto {
  mail: string;
  contraseña: string;
}

export interface RegisterDto {
  nombre: string,
  apellido: string,
  mail: string,
  dni: string,
  contraseña: string,
  telefono: string,
  cuit: string,
  rol: Rol
}
export interface User {
  id: number;
  mail: string;
  rol: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromToken());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  login(loginDto: LoginDto): Observable<{token: string}> {
    return this.http.post<{token: string}>(`${this.apiUrl}/login`, loginDto).pipe(
      tap(token => {
        this.setToken(token.token);
        this.currentUserSubject.next(this.getUserFromToken());
      })
    );
  }

  register(registerDto: RegisterDto): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/register`, registerDto).pipe(
      tap(token => {
        this.setToken(token);
        this.currentUserSubject.next(this.getUserFromToken());
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  private setToken(token: string): void {
    localStorage.removeItem('token');
    localStorage.setItem('token', token);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    try {
      const payload = this.decodeToken(token);
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  private getUserFromToken(): User | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = this.decodeToken(token);
      return {
        id: payload.id,
        mail: payload.mail,
        rol: payload.rol
      };
    } catch {
      return null;
    }
  }

  private decodeToken(token: string): any {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(window.atob(base64));
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.rol === role;
  }

  /**
   * Obtiene el ID del usuario actual del token
   */
  getCurrentUserId(): number | null {
    const user = this.getCurrentUser();
    return user?.id || null;
  }
}