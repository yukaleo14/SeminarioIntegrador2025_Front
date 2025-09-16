import { Component } from '@angular/core';
import { Empresa } from '../../models/Empresa';
import { CardEmpresa } from '../card-empresa/card-empresa';

@Component({
  selector: 'app-listado-negocios',
  imports: [CardEmpresa],
  templateUrl: './listado-negocios.html',
  styleUrl: './listado-negocios.scss'
})
export class ListadoNegocios {
  // TODO: Obtener negocios/empresas por service
  empresas = MOCK_EMPRESAS;
}

const MOCK_EMPRESAS: Empresa[] = [
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
];
