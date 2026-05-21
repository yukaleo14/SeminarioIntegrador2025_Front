import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { Comprador } from '../models/Comprador';

@Injectable({
  providedIn: 'root'
})
export class CompradorService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/comprador`;

  getCompradores(): Observable<Comprador[]> {
    return this.http.get<Comprador[]>(`${this.apiUrl}`);
  }

  getCompradorByUserId(userId: number): Observable<Comprador> {
    return this.http.get<Comprador>(`${this.apiUrl}/user/${userId}`);
}
  
}