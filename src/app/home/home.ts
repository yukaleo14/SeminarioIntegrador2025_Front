import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Buscador } from '../components/buscador/buscador';
import { CarruselCategorias } from '../components/carrusel-categorias/carrusel-categorias';
import { Header } from '../components/header/header';
import { ListadoSucursales } from '../components/listado-sucursales/listado-sucursales';
import { ProductoCard } from '../components/producto-card/producto-card';
import { ConfirmarPedidoLauncher } from '../services/confirmar-pedido-launcher';
import { Saludo } from '../components/saludo/saludo';
import { AuthService } from '../services/auth-service';
import { CarroService } from '../services/carro-service';
import { ProductoService } from '../services/producto-service';
import { Producto } from '../models/Producto';
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
    ProductoCard,
    Header,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  private authService = inject(AuthService);
  private productoService = inject(ProductoService);
  private carroService = inject(CarroService);
  private pedidoLauncher = inject(ConfirmarPedidoLauncher);
  private router = inject(Router);

  productos = signal<Producto[]>([]);
  totalItemsCarrito = computed(() => this.carroService.getTotalItems());

  ngOnInit() {
    this.productoService.getProductos().subscribe({
      next: (data) => this.productos.set(data),
      error: console.error,
    });
  }

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

  abrirCarrito() {
    const sucursal = this.carroService.getItems()[0]?.producto.sucursal;
    if (!sucursal) return;
    this.pedidoLauncher.abrir(sucursal);
  }
}
