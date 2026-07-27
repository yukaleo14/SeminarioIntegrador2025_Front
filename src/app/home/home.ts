import { Component, computed, inject, OnInit, OnDestroy, signal, ViewChild, ElementRef } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table'; // <-- Agregado para la tabla
import { Router, RouterLink } from '@angular/router';
import * as L from 'leaflet';
import { Subject, takeUntil } from 'rxjs';

import { Buscador } from '../components/buscador/buscador';
import { CarruselCategorias } from '../components/carrusel-categorias/carrusel-categorias';
import { Header } from '../components/header/header';
import { ListadoSucursales } from '../components/listado-sucursales/listado-sucursales';
import { ProductoCard } from '../components/producto-card/producto-card';
import { Chat } from '../components/chat/chat';
import { Producto } from '../models/Producto';
import { Rol } from '../models/Rol';
import { Sucursal } from '../models/Sucursal';
import { AuthService } from '../services/auth-service';
import { CarroService } from '../services/carro-service';
import { ConfirmarPedidoLauncher } from '../services/confirmar-pedido-launcher';
import { Pedido, PedidoService } from '../services/pedido-service';
import { ProductoService } from '../services/producto-service';
import { SocketService } from '../services/socket.service';
import { SucursalService } from '../services/sucursal-service';
import { CurrencyPipe } from '@angular/common';

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
    MatTableModule,
    CurrencyPipe,
    Chat,
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
  private socketService = inject(SocketService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  productos = signal<Producto[]>([]);
  pedidosPendientes = signal<Pedido[]>([]);
  
  sucursalSeleccionada = signal<Sucursal | null>(null);
  pedidosPublicados = signal<Pedido[]>([]);
  pedidoTomado = signal<Pedido | null>(null);
  pedidoActivoComprador = signal<Pedido | null>(null);
  chatPedidoId = signal<number | null>(null);

  totalItemsCarrito = computed(() => this.carroService.getTotalItems());

  private map?: L.Map;

  // Nuevas variables para el repartidor
  private repartidorUbicacion: [number, number] | null = null;
  private repartidorMarker?: L.Marker;
  private rutaPolilinea?: L.Polyline;
  private clienteMarker?: L.Marker;

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

      this.socketService.connect();
      setTimeout(() => {
        this.socketService.joinCompanyRoom(this.authService.getEmpresaId()!);
      }, 600);

      this.socketService.onNuevoPedido().pipe(takeUntil(this.destroy$)).subscribe((nuevo: Pedido) => {
        if (nuevo.estado?.nombre === 'CREADO' || nuevo.estado?.nombre === 'PENDIENTE') {
          this.pedidosPendientes.update(current => [nuevo, ...current]);
        }
      });

      this.socketService.onPedidoActualizado().pipe(takeUntil(this.destroy$)).subscribe((actualizado: Pedido) => {
        const nombre = actualizado.estado?.nombre;
        if (nombre === 'CREADO' || nombre === 'PENDIENTE') {
          const existe = this.pedidosPendientes().find(p => p.id === actualizado.id);
          if (!existe) {
            this.pedidosPendientes.update(current => [actualizado, ...current]);
          }
        } else {
          this.pedidosPendientes.update(current => current.filter(p => p.id !== actualizado.id));
        }
      });
    }

    if (this.isRepartidor) {
      this.cargarPedidoTomado();
    }

    if (this.isComprador) {
      this.cargarPedidoActivoComprador();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
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

    this.repartidorUbicacion = [
      VILLAMARIA[0] + (Math.random() - 0.5) * 0.04,
      VILLAMARIA[1] + (Math.random() - 0.5) * 0.04
    ];

    this.repartidorMarker = L.marker(this.repartidorUbicacion, {
      icon: this.pinIcon('#3498db') // Azul para diferenciarlo de las sucursales rojas
    }).addTo(this.map);
    this.repartidorMarker.bindTooltip('📍 Mi Ubicación', { direction: 'top' });

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
        const publicado = pedidos.filter(p => 
          p.estado?.nombre === 'PUBLICADO'
        );
        this.pedidosPublicados.set(publicado);
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


  cambiarEstado(pedido: Pedido, nuevoEstado: string) {if (!nuevoEstado || pedido.estado?.nombre === nuevoEstado) return;

      this.pedidoService.actualizarEstado(pedido.id, nuevoEstado).subscribe({
        next: (pedidoActualizado) => {
          console.log(`Pedido ${pedido.numero} actualizado a estado ${nuevoEstado}`);
          
          this.pedidosPublicados.update(pedidosActuales => 
            pedidosActuales.map(p => 
              p.id === pedido.id ? { ...p, estado: { ...p.estado, nombre: nuevoEstado, id: p.estado?.id ?? 0 } } : p
            )
          );

          if (nuevoEstado === 'ASIGNADO') {
            const pedidoGuardado = { ...pedido, estado: { ...pedido.estado, nombre: 'ASIGNADO', id: pedido.estado?.id ?? 0 } } as Pedido;
            this.guardarPedidoTomado(pedidoGuardado);
            this.trazarRutaASucursal();
          } 
          else if (nuevoEstado === 'ENRUTA') {
            const pedidoActualizadoLocal = { ...pedido, estado: { ...pedido.estado, nombre: 'ENRUTA', id: pedido.estado?.id ?? 0 } } as Pedido;
            this.guardarPedidoTomado(pedidoActualizadoLocal);
            if (pedidoActualizado.ruta && pedidoActualizado.ruta.destino) {
              this.mostrarUbicacionEntrega(pedidoActualizado);
            } else {
              console.log('El pedido actualizado no incluye los detalles de la ruta. Obteniendo pedido completo...');
              
              this.pedidoService.findOne(pedido.id).subscribe({
                next: (pedidoCompleto) => {
                  this.mostrarUbicacionEntrega(pedidoCompleto);
                },
                error: (err) => {
                  console.error('Error al obtener el pedido completo:', err);
                  alert('No se pudo trazar la ruta porque no se encontraron los detalles del destino.');
                }
              });
            }
          } 
          else if (nuevoEstado === 'ENTREGADO') {
            this.limpiarPedidoTomado();
            this.pedidosPublicados.update(pedidosActuales => 
              pedidosActuales.filter(p => p.id !== pedido.id)
            );
            if (this.rutaPolilinea) this.map?.removeLayer(this.rutaPolilinea);
            if (this.clienteMarker) this.map?.removeLayer(this.clienteMarker);
          }
        },
        error: (err) => {
          console.error('Error al actualizar estado del pedido:', err);
          alert('Error al actualizar el estado del pedido. Por favor, intenta nuevamente.');
        }
      });
  }

  // Abre o cierra el chat flotante para el pedido indicado.
  toggleChat(pedidoId: number) {
    if (this.chatPedidoId() === pedidoId) {
      this.chatPedidoId.set(null);
    } else {
      this.chatPedidoId.set(pedidoId);
    }
  }

  private static readonly STORAGE_KEY_PEDIDO_TOMADO = 'repartidor-pedido-tomado';

  private cargarPedidoTomado(): void {
    this.pedidoService.findPedidoActivo().subscribe({
      next: (pedido) => {
        if (pedido && pedido.estado?.nombre !== 'ENTREGADO' && pedido.estado?.nombre !== 'CANCELADO') {
          this.pedidoTomado.set(pedido);
        } else {
          this.pedidoTomado.set(null);
        }
      },
      error: () => {
        this.pedidoTomado.set(null);
      }
    });
  }

  private cargarPedidoActivoComprador(): void {
    this.pedidoService.findPedidoActivoComprador().subscribe({
      next: (pedido) => {
        this.pedidoActivoComprador.set(pedido);
      },
      error: () => {
        this.pedidoActivoComprador.set(null);
      }
    });
  }

  private guardarPedidoTomado(pedido: Pedido): void {
    this.pedidoTomado.set(pedido);
  }

  private limpiarPedidoTomado(): void {
    this.pedidoTomado.set(null);
  }

  private trazarRutaASucursal() {const sucursal = this.sucursalSeleccionada();
    if (!sucursal || !this.repartidorUbicacion || !this.map) return;

    const sucLat = sucursal.ubicacion?.posicion?.coordenadaX ?? sucursal.ubicacion?.coordenadaX;
    const sucLng = sucursal.ubicacion?.posicion?.coordenadaY ?? sucursal.ubicacion?.coordenadaY;

    if (sucLat != null && sucLng != null) {
      // Trazar ruta azul (Repartidor -> Sucursal)
      this.obtenerRutaYMostrar(
        this.repartidorUbicacion, 
        [sucLat, sucLng], 
        '#3498db'
      );
    }
  }

  private obtenerRutaYMostrar(start: L.LatLngTuple, end: L.LatLngTuple, colorRuta: string): void {
    const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;

    fetch(url)
      .then(response => {
        if (!response.ok) throw new Error('Error en la respuesta de OSRM');
        return response.json();
      })
      .then((data: any) => {
        if (!this.map) return;

        // Limpiar ruta anterior
        if (this.rutaPolilinea) {
          this.map.removeLayer(this.rutaPolilinea);
        }

        // Mapear coordenadas al formato Leaflet
        const routeCoords = data.routes[0].geometry.coordinates.map(
          (c: any): L.LatLngTuple => [c[1], c[0]]
        );

        // Dibujar la línea sólida sobre las calles
        this.rutaPolilinea = L.polyline(routeCoords, { 
          color: colorRuta, 
          weight: 5 
        }).addTo(this.map);

        // Ajustar el zoom para ver la ruta completa
        const bounds = L.latLngBounds(routeCoords);
        this.map.fitBounds(bounds, { padding: [50, 50] });
      })
      .catch(err => console.error('Error obteniendo ruta OSRM:', err));
  }

  private mostrarUbicacionEntrega(pedido: Pedido) {if (!this.map) return;
// Validación estricta: idéntica a la de cargarDatosPedido en seguimiento-pedido.ts
    
    if (!pedido?.ruta?.origen?.posicion || !pedido?.ruta?.destino?.posicion) {
      console.error('El pedido no tiene ruta completa:', pedido);
      alert('No se pudo cargar la ruta: Faltan las coordenadas de origen o destino.');
      return;
    }

    // Extraemos las coordenadas tal cual lo hace seguimiento-pedido.ts
    const coordsOrigen = pedido.ruta.origen.posicion;
    const coordsDestino = pedido.ruta.destino.posicion;

    const latOrigen = coordsOrigen.coordenadaX;
    const lngOrigen = coordsOrigen.coordenadaY;
    
    const latDestino = coordsDestino.coordenadaX;
    const lngDestino = coordsDestino.coordenadaY;

    // Limpiar marcador del cliente anterior si existe
    if (this.clienteMarker) {
      this.map.removeLayer(this.clienteMarker);
    }
    
    // Crear el Pin Verde del cliente (Destino)
    this.clienteMarker = L.marker([latDestino, lngDestino], {
      icon: this.pinIcon('#27ae60') 
    }).addTo(this.map);
    
    // Mostramos la calle del destino o el nombre del comprador como respaldo
    const textoDestino = pedido.ruta.destino.calle ?? pedido.comprador?.nombre ?? 'Cliente';
    this.clienteMarker.bindTooltip(`🏠 Destino: ${textoDestino}`, { direction: 'top' });

    // Trazar la ruta verde (Sucursal/Origen -> Cliente/Destino) usando las coordenadas de la base de datos
    this.obtenerRutaYMostrar(
      [latOrigen, lngOrigen], 
      [latDestino, lngDestino], 
      '#27ae60'
    );
  }

  
  
}