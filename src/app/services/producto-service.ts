import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../environments/environment';
import { Producto } from '../models/Producto';
import { AuthService } from './auth-service';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private apiUrl = `${environment.apiUrl}/producto`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : ''
    });
  }

  getProductos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.apiUrl).pipe(
      catchError(this.handleError)
    );
  }

  getProducto(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  getProductosBySucursalAndCategoria(sucursalId: number, categoriaId: number): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.apiUrl}/sucursal/?sucursalId=${sucursalId}&categoriaId=${categoriaId}`).pipe(
      catchError(this.handleError)
    );
  }

  createProducto(producto: Producto): Observable<void> {
    // El backend devuelve 201 sin cuerpo, por eso usamos Observable<void>
    // y responseType: 'text' para que Angular no intente parsear JSON vacío
    return this.http.post<void>(this.apiUrl, producto, {
      headers: this.getHeaders(),
      responseType: 'text' as 'json'
    }).pipe(
      catchError(this.handleError)
    );
  }

  updateProducto(id: number, producto: Partial<Producto>): Observable<void> {
    // Mismo criterio por si el PATCH tampoco devuelve cuerpo
    return this.http.patch<void>(`${this.apiUrl}/${id}`, producto, {
      headers: this.getHeaders(),
      responseType: 'text' as 'json'
    }).pipe(
      catchError(this.handleError)
    );
  }

  deleteProducto(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders(),
      responseType: 'text' as 'json'
    }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Error desconocido';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Código: ${error.status}\nMensaje: ${error.message}`;
    }
    return throwError(() => new Error(errorMessage));
  }
}