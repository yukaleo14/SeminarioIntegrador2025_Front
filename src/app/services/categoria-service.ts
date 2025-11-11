import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { Categoria } from '../models/Categoria';

@Injectable({
  providedIn: 'root'
})
export class CategoriaService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/categoria`;

  getLista(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.apiUrl}`);
  }
  getListaBySucursal(sucursalId: number): Observable<Categoria[]> {
    const params = new HttpParams().set('sucursalId', sucursalId.toString());
    return this.http.get<Categoria[]>(`${this.apiUrl}`, { params });
  }
}