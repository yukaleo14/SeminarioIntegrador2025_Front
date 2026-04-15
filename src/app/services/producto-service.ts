import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { environment } from '../environments/environment';
import { Producto } from '../models/Producto';
import { Sucursal } from '../models/Sucursal';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private apiUrl = `${environment.apiUrl}/producto`;

  constructor(private http: HttpClient) {}

  getById(id: number): Observable<Producto>{
    return this.http.get<Producto>(`${this.apiUrl}/${id}`);
  }

  getProductosBySucursalAndCategoria(sucursalId?:number, categoriaId?: number): Observable<Producto[]>{
    let params = new HttpParams();
    if (sucursalId) {
      params = params.set('sucursalId', sucursalId.toString());
    }
    if (categoriaId) {
      params = params.set('categoriaId', categoriaId.toString());
    }
    return this.http.get<Producto[]>(`${this.apiUrl}/sucursal`, {params});
  }

  getByCategoria(categoriaId: number): Observable<Producto[]> {
    if (!categoriaId) {
      return throwError(() => new Error('ID de categoría inválido'));
    }
    const params = new HttpParams().set('categoriaId', categoriaId.toString());
    return this.http.get<Producto[]>(`${this.apiUrl}/categoria/${categoriaId}`);
  }
}
