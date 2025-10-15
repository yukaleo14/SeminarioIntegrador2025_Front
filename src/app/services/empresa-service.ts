import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Empresa } from '../models/Empresa';
import { environment } from '../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Producto } from '../models/Producto';

@Injectable({
  providedIn: 'root'
})
export class EmpresaService {
  readonly local_example: Empresa = {id: 123, nombre: 'Hola', portada: 'hola', categorias:''}
  private apiUrl = `${environment.apiUrl}/empresa`;

  constructor(private http: HttpClient) {}

  getById(id: number): Observable<Empresa>{
    return this.http.get<Empresa>(`${this.apiUrl}/${id}`);
    return of(this.local_example)
  }

  getProductos(): Observable<Producto[]>{
    return this.http.get<Producto[]>(`${this.apiUrl}/productos`);
  }
}
