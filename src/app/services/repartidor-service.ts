import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { Repartidor } from '../models/Repartidor';

@Injectable({
  providedIn: 'root'
})
export class RepartidorService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/repartidor`;


  getRepartidorIdByUserId(userId: number): Observable<Repartidor> {
    return this.http.get<Repartidor>(`${this.apiUrl}/user/${userId}`);
    }
  
}