import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { User } from './auth-service';

export interface CreateUserDto {
  mail: string;
  contrasena: string;
  nombre: string;
  apellido: string;
  rol: string;
  dni: string;
  telefono: string;
  cuit?: string;
}

export interface UpdateUserDto {
  mail?: string;
  nombre?: string;
  apellido?: string;
  rol?: string;
  dni?: string;
  telefono?: string;
  cuit?: string;
  // No incluir contraseña aquí a menos que tengas un endpoint específico para cambiarla
}

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene todos los usuarios
   */
  findAll(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  /**
   * Obtiene un usuario por ID
   */
  findOne(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  /**
   * Actualiza un usuario
   */
  update(id: number, updateUserDto: UpdateUserDto): Observable<string> {
    return this.http.patch<string>(`${this.apiUrl}/${id}`, updateUserDto);
  }

  /**
   * Elimina un usuario
   */
  remove(id: number): Observable<string> {
    return this.http.delete<string>(`${this.apiUrl}/${id}`);
  }

}
