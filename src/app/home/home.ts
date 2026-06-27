import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { Buscador } from '../components/buscador/buscador';
import { CarruselCategorias } from '../components/carrusel-categorias/carrusel-categorias';
import { Header } from '../components/header/header';
import { ListadoSucursales } from '../components/listado-sucursales/listado-sucursales';
import { ProductoCard } from '../components/producto-card/producto-card';
import { Producto } from '../models/Producto';
import { Rol } from '../models/Rol';
import { AuthService } from '../services/auth-service';
import { CarroService } from '../services/carro-service';
import { ConfirmarPedidoLauncher } from '../services/confirmar-pedido-launcher';
import { Pedido, PedidoService } from '../services/pedido-service';
import { ProductoService } from '../services/producto-service';

@Component({
  selector: 'app-home',
  imports: [
    Buscador,
    CarruselCategorias,
    ListadoSucursales,
    ProductoCard,
    Header,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatChipsModule,
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  private authService = inject(AuthService);
  private productoService = inject(ProductoService);
  private carroService = inject(CarroService);
  private pedidoLauncher = inject(ConfirmarPedidoLauncher);
  private pedidoService = inject(PedidoService);
  private router = inject(Router);

  productos = signal<Producto[]>([]);
  pedidosPendientes = signal<Pedido[]>([]);
  totalItemsCarrito = computed(() => this.carroService.getTotalItems());

  ngOnInit() {
    this.productoService.getProductos().subscribe({
      next: (data) => this.productos.set(data),
      error: console.error,
    });

    if (this.authService.isEmpresa()) {
      this.pedidoService.getPedidosDeMiEmpresa(this.authService.getEmpresaId()!).subscribe({
        next: (pedidos) => {
          const pendientes = pedidos.filter(
            (p) => p.estado?.nombre === 'CREADO' || p.estado?.nombre === 'PENDIENTE'
          );
          this.pedidosPendientes.set(pendientes);
        },
        error: console.error,
      });
    }
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
