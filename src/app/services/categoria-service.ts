import { HttpClient } from '@angular/common/http';
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
    return this.http.get<Categoria[]>(`/${this.apiUrl}/`);
  }
}
/* const LOCAL_DATA: CategoriaItem[] = [
  {
    id: 1,
    nombre: 'Hamburguesas',
    imagen: '/img/categoria-hamburguesas.png'
  },
  {
    id: 2,
    nombre: 'Pizzas',
    imagen: '/img/categoria-pizzas.png'
  },
  {
    id: 3,
    nombre: 'Panadería',
    imagen: '/img/categoria-panaderias.png'
  },
  {
    id: 4,
    nombre: 'Ensaladas',
    imagen: '/img/categoria-ensaladas.png'
  }
]; */