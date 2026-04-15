import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, Observable, tap, throwError } from 'rxjs';
import { environment } from '../environments/environment';
import { Rol } from '../models/Rol';
import { Empresa } from '../models/Empresa';
import { Comprador } from '../models/Comprador';
import { Repartidor } from '../models/Repartidor';
export interface LoginDto {
  mail: string;
  contrasena: string;
}

export interface RegisterDto {
  nombre: string,
  apellido: string,
  mail: string,
  dni: string,
  contrasena: string,
  telefono: string,
  cuitCuil: string,
  rol: Rol,
  imagenPerfil: string,
  altura: string,
  calle: string,
  nombreUbicacion: string,
  coordenadaX: number,
  coordenadaY: number
}

export class User {
  id: number;
  mail: string;
  rol: Rol;
  empresa?: Empresa;
  comprador?: Comprador;
  repartidor?: Repartidor;
  constructor(id: number, mail: string, rol: Rol) {
    this.id = id;
    this.mail = mail;
    this.rol = rol;
  }
  static getDataByRole(user: User): Empresa | Comprador | Repartidor | undefined {
    switch (user.rol) {
      case Rol.EMPRESA:
        return user.empresa;
      case Rol.COMPRADOR:
        return user.comprador;
      case Rol.REPARTIDOR:
        return user.repartidor;
      default:
        return undefined;
    }
  }
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
   return this.http.post(`${this.apiUrl}/register`, registerDto, {
    responseType: 'text' as const   // ← Esta es la clave
  }).pipe(
    tap((token: string) => {
      console.log('✅ Token recibido del backend:', token);
      this.setToken(token);
      this.currentUserSubject.next(this.getUserFromToken());
    }),
    catchError((error) => {
      console.error('Error en register:', error);
      throw error;
    })
  );
    
  }

  logout(): void {
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
    //this.router.navigate(['/login']);
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
      return new User( payload.id, payload.mail, payload.rol);
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

  hasRole(role: Rol): boolean {
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

    /**
     * Obtiene el perfil del usuario actual
     * Usa el endpoint /auth/profile que ya existe en el backend
     */
    getCurrentUserProfile(): Observable<User> {
      return this.http.get<User>(`${this.apiUrl}/profile`);
    }

    getEmpresaId(): number | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = this.decodeToken(token);
      
      // Prioridad 1: empresaId directo en el token
      if (payload.empresaId) return payload.empresaId;
      
      // Prioridad 2: empresa?.id (si guardaste el objeto empresa en el JWT)
      if (payload.empresa?.id) return payload.empresa.id;

      // Prioridad 3: Si solo tenés userId y el rol es EMPRESA, podemos usarlo como fallback
      if (payload.rol === Rol.EMPRESA) {
        return payload.id;   // Muchos sistemas usan el mismo ID para usuario y empresa
      }

      return null;
    } catch (e) {
      console.error('Error al obtener empresaId del token', e);
      return null;
    }
  }

  /**
   * Verifica si el usuario actual es una Empresa
   */
  isEmpresa(): boolean {
    return this.hasRole(Rol.EMPRESA);
  }
}