import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Empresa } from '../models/Empresa';

@Injectable({
  providedIn: 'root'
})
export class EmpresaService {
  readonly local_example: Empresa = {id: 123, nombre: 'Hola', portada: 'hola', categorias:''}
  getById(id: number): Observable<Empresa>{
    return of(this.local_example)
  }
}
