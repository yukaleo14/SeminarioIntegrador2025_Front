import { Component } from '@angular/core';
import { Saludo } from "../components/saludo/saludo";
import { Buscador } from "../components/buscador/buscador";
import { CarruselCategorias } from "../components/carrusel-categorias/carrusel-categorias";
import { ListadoNegocios } from "../components/listado-negocios/listado-negocios";
import { Header } from "../components/header/header";


@Component({
  selector: 'app-home',
  imports: [Saludo, Buscador, CarruselCategorias, ListadoNegocios, Header],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home {
}
