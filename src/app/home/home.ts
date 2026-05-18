import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Buscador } from '../components/buscador/buscador';
import { CarruselCategorias } from '../components/carrusel-categorias/carrusel-categorias';
import { Header } from '../components/header/header';
import { ListadoSucursales } from '../components/listado-sucursales/listado-sucursales';
import { Saludo } from '../components/saludo/saludo';
import { AuthService } from '../services/auth-service';
import { Rol } from '../models/Rol';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-home',
  imports: [
    Saludo,
    Buscador,
    CarruselCategorias,
    ListadoSucursales,
    Header,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private authService = inject(AuthService);

  get isEmpresa(): boolean {
    return this.authService.isEmpresa();
  }

  get isRepartidor(): boolean {
    return this.authService.hasRole(Rol.REPARTIDOR);
  }

  get isComprador(): boolean {
    return !this.isEmpresa && !this.isRepartidor;
  }

  get nombreUsuario(): string {
    return this.authService.getCurrentUser()?.mail?.split('@')[0] ?? '';
  }
}
