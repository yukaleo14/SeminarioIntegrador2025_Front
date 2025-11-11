import { Component } from '@angular/core';
import { Buscador } from "../components/buscador/buscador";
import { CarruselCategorias } from "../components/carrusel-categorias/carrusel-categorias";
import { Header } from "../components/header/header";
import { ListadoSucursales } from "../components/listado-sucursales/listado-sucursales";
import { Saludo } from "../components/saludo/saludo";


@Component({
  selector: 'app-home',
  imports: [Saludo, Buscador, CarruselCategorias, ListadoSucursales, Header],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home {
}
