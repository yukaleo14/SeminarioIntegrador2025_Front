import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, of, throwError } from 'rxjs';
import { CategoriaItem } from '../models/CategoriaItem';

@Injectable({
  providedIn: 'root'
})
export class Categoria {
  private http = inject(HttpClient);
  private readonly baseUrl = '/backend';
  private LOCAL_DATA = LOCAL_DATA;

  getLista(): Observable<CategoriaItem[]> {
    return of(this.LOCAL_DATA).pipe(
      catchError(this.handleError)
    )
  }
  //return this.http.get<CategoriaItem[]>(`/${this.baseUrl}/categorias`);

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ocurrió un error desconocido';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error del cliente: ${error.error.message}`;
    } else {
      // Server-side error
      switch ( error.status) {
        case 0:
          errorMessage = 'No se pudo conectar al servidor';
          break;
        case 404:
          errorMessage = 'Recurso no encontrado';
          break;
        case 500:
          errorMessage = 'Error interno del servidor';
          break;
        case 503:
          errorMessage = 'Servicio no disponible';
          break;
        default:
          errorMessage = `Error del servidor: ${error.status} - ${error.message}`;
      }
    }
    return throwError(() => new Error(errorMessage));
  }
}
const LOCAL_DATA: CategoriaItem[] = [
  {
    id: 1,
    nombre: 'Hamburguesas',
    imagen: '/img/categoria-hamburguesas.png'
  },
  {
    id: 2,
    nombre: 'Pizzas',
    imagen: '/img/categoria-pizzas.png'
  },
  {
    id: 3,
    nombre: 'Panadería',
    imagen: '/img/categoria-panaderias.png'
  },
  {
    id: 4,
    nombre: 'Ensaladas',
    imagen: '/img/categoria-ensaladas.png'
  }
];