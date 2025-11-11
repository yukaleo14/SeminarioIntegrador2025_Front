import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
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
      params = params.set('sucursalId', sucursalId);
    }
    if (categoriaId) {
      params = params.set('categoriaId', categoriaId);
    }
    return this.http.get<Producto[]>(`${this.apiUrl}/sucursal`, {params});
  }
}
