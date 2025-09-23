import { Component, OnInit, signal, WritableSignal } from '@angular/core';
import { delay, Observable, of } from 'rxjs';
import { Empresa } from '../../models/Empresa';
import { CardEmpresa } from '../card-empresa/card-empresa';
import { Skeleton } from '../skeleton/skeleton';

@Component({
  selector: 'app-listado-negocios',
  imports: [CardEmpresa, Skeleton],
  templateUrl: './listado-negocios.html',
  styleUrl: './listado-negocios.scss'
})
export class ListadoNegocios implements OnInit{
  // TODO: Obtener negocios/empresas por service
  empresas: WritableSignal<Empresa[]> = signal([]);

  ngOnInit(): void {
    MOCK_EMPRESAS.subscribe({
      next: (data) =>{
        this.empresas.set(data)
      },
      error:(err)=>{
        this.empresas.set([]);
      }
    })
  }
}

const MOCK_EMPRESAS: Observable<Empresa[]> = of([
  {
    id: 1,
    nombre: "Rose Garden Restaurant",
    portada: "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800",
    categorias: "Burger - Chicken - Riche - Wings"
  },
  {
    id: 2,
    nombre: "Bella Italia",
    portada: "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=800",
    categorias: "Pizza - Pasta - Italian"
  },
  {
    id: 3,
    nombre: "Sushi World",
    portada: "https://images.unsplash.com/photo-1553621042-f6e147245754?w=800",
    categorias: "Sushi - Japanese - Seafood"
  },
  {
    id: 4,
    nombre: "Green Delight",
    portada: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800",
    categorias: "Vegan - Salads - Healthy"
  }
]).pipe(delay(1000));
