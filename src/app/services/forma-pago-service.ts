import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface FormaPago {
  id: number;
  nombre: string;
}

@Injectable({ providedIn: 'root' })
export class FormaPagoService {
  private apiUrl = `${environment.apiUrl}/forma-pago`;

  constructor(private http: HttpClient) {}

  findAll(): Observable<FormaPago[]> {
    return this.http.get<FormaPago[]>(this.apiUrl);
  }
}
