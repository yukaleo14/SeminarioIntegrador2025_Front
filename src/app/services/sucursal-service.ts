import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { Sucursal } from '../models/Sucursal';

@Injectable({
  providedIn: 'root'
})
export class SucursalService {
  private apiUrl = `${environment.apiUrl}/sucursal`;

  constructor(private http: HttpClient) {}

  getById(id: number): Observable<Sucursal>{
    return this.http.get<Sucursal>(`${this.apiUrl}/${id}`);
  }

  findAll(): Observable<Sucursal[]>{
    return this.http.get<Sucursal[]>(`${this.apiUrl}`);
  }
}
