import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { Producto } from '../models/Producto';
import { Sucursal } from '../models/Sucursal';

@Injectable({
  providedIn: 'root'
})
export class EmpresaService {
  private apiUrl = `${environment.apiUrl}/empresa`;

  constructor(private http: HttpClient) {}

  getById(id: number): Observable<Sucursal>{
    return this.http.get<Sucursal>(`${this.apiUrl}/${id}`);
  }

  getProductos(): Observable<Producto[]>{
    return this.http.get<Producto[]>(`${this.apiUrl}/productos`);
  }
}
