import { Component, computed, inject, OnInit, OnDestroy, signal, ViewChild, ElementRef } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table'; // <-- Agregado para la tabla
import { Router, RouterLink } from '@angular/router';
import * as L from 'leaflet'; // <-- Importación de Leaflet

import { Buscador } from '../components/buscador/buscador';
import { CarruselCategorias } from '../components/carrusel-categorias/carrusel-categorias';
import { Header } from '../components/header/header';
import { ListadoSucursales } from '../components/listado-sucursales/listado-sucursales';
import { ProductoCard } from '../components/producto-card/producto-card';
import { Producto } from '../models/Producto';
import { Rol } from '../models/Rol';
import { Sucursal } from '../models/Sucursal';
import { AuthService } from '../services/auth-service';
import { CarroService } from '../services/carro-service';
import { ConfirmarPedidoLauncher } from '../services/confirmar-pedido-launcher';
import { Pedido, PedidoService } from '../services/pedido-service';
import { ProductoService } from '../services/producto-service';
import { SucursalService } from '../services/sucursal-service'; // <-- Agregado
import { CurrencyPipe } from '@angular/common'; // <-- Agregado para formatear montos

const VILLAMARIA: [number, number] = [-32.41378, -63.25237];

@Component({
  selector: 'app-home',
  standalone: true,
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
    MatTableModule, // <-- Registramos el módulo de tabla
    CurrencyPipe
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private productoService = inject(ProductoService);
  private carroService = inject(CarroService);
  private pedidoLauncher = inject(ConfirmarPedidoLauncher);
  private pedidoService = inject(PedidoService);
  private sucursalService = inject(SucursalService);
  private router = inject(Router);

  productos = signal<Producto[]>([]);
  pedidosPendientes = signal<Pedido[]>([]);
  
  // Nuevas señales para la vista del Repartidor
  sucursalSeleccionada = signal<Sucursal | null>(null);
  pedidosPreparacion = signal<Pedido[]>([]);

  totalItemsCarrito = computed(() => this.carroService.getTotalItems());

  private map?: L.Map;

  // Usamos un setter para el ViewChild porque el elemento está dentro de un @if
  @ViewChild('mapEl') set mapElement(el: ElementRef<HTMLDivElement>) {
    if (el && !this.map && this.isRepartidor) {
      this.inicializarMapa(el.nativeElement);
    }
  }

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

  ngOnDestroy() {
    this.map?.remove();
  }

  // ... (getters isEmpresa, isRepartidor, isComprador, nombreUsuario, abrirCarrito se mantienen igual) ...
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

  // --- Lógica del Mapa y Repartidor ---

  private inicializarMapa(htmlElement: HTMLDivElement) {
    this.map = L.map(htmlElement).setView(VILLAMARIA, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
    }).addTo(this.map);

    // Obtenemos todas las sucursales para pintarlas
    this.sucursalService.findAll().subscribe({
      next: (sucursales) => {
        sucursales.forEach((sucursal) => {
          const lat = sucursal.ubicacion?.posicion?.coordenadaX ?? sucursal.ubicacion?.coordenadaX;
          const lng = sucursal.ubicacion?.posicion?.coordenadaY ?? sucursal.ubicacion?.coordenadaY;

          if (lat != null && lng != null) {
            const marker = L.marker([lat, lng], {
              icon: this.pinIcon('#e74c3c')
            }).addTo(this.map!);

            marker.bindTooltip(sucursal.nombre, { direction: 'top' });

            // Al hacer click, filtramos los pedidos de esa sucursal
            marker.on('click', () => {
              this.seleccionarSucursal(sucursal);
            });
          }
        });
        
        // Recalcular el tamaño una vez visible para evitar glitches visuales
        setTimeout(() => this.map?.invalidateSize(), 200);
      }
    });
  }

 private seleccionarSucursal(sucursal: Sucursal) {
    this.sucursalSeleccionada.set(sucursal);
    
    // Obtener los pedidos para esta sucursal (Ajustar al método real de tu servicio)
    // Aquí filtramos asumiendo que un método te devuelve los pedidos a repartir:
    this.pedidoService.findBySucursal(sucursal.empresa?.id ?? 0).subscribe({
      next: (pedidos) => {
        const enPreparacion = pedidos.filter(p => 
          p.estado?.nombre === 'ENPREPARACION'
        );
        this.pedidosPreparacion.set(enPreparacion);
      },
      error: console.error
    });

  }

  private pinIcon(color: string): L.DivIcon {
    return L.divIcon({
      className: 'mapa-pin',
      html: `<svg width="30" height="42" viewBox="0 0 24 36" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="${color}"/>
        <circle cx="12" cy="12" r="5" fill="#fff"/></svg>`,
      iconSize: [30, 42],
      iconAnchor: [15, 42],
    });
  }


  cambiarEstado(pedido: Pedido, nuevoEstado: string) {
      if (!nuevoEstado || pedido.estado?.nombre === nuevoEstado) return;

      this.pedidoService.actualizarEstado(pedido.id, nuevoEstado).subscribe({
        next: (pedidoActualizado) => {
          console.log(`Pedido ${pedido.numero} actualizado a estado ${nuevoEstado}`);
          
          this.pedidosPreparacion.update(pedidosActuales => 
            pedidosActuales.filter(p => p.id !== pedido.id)
          );
        },
        error: (err) => {
          console.error('Error al actualizar estado del pedido:', err);
          alert('Error al actualizar el estado del pedido. Por favor, intenta nuevamente.');
        }
      });
  }
  
}