import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil, switchMap, of, catchError } from 'rxjs';
import * as L from 'leaflet';

import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';

import { AuthService } from '../services/auth-service';
import { PedidoService, Pedido } from '../services/pedido-service';
import { SocketService } from '../services/socket.service';
import { Chat } from '../components/chat/chat';
import { Rol } from '../models/Rol';

interface PosicionGps {
  coordenadaX: number;
  coordenadaY: number;
}

interface UbicacionConPosicion {
  calle?: string;
  altura?: string;
  nombre?: string;
  posicion: PosicionGps;
}

interface PedidoConRuta extends Pedido {
  tiempoRepartoEstimado?: number;
  ruta: {
    id: number;
    tarifaDistancia?: number;
    origen: UbicacionConPosicion;
    destino: UbicacionConPosicion;
  };
}

@Component({
  selector: 'app-repartidor',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDividerModule,
    Chat,
  ],
  templateUrl: './repartidor.html',
  styleUrl: './repartidor.scss',
})
export class RepartidorComponent implements OnInit, OnDestroy {
  disponibles = signal<PedidoConRuta[]>([]);
  misPedidos = signal<PedidoConRuta[]>([]);
  isLoadingDisponibles = signal(true);
  isLoadingMisPedidos = signal(true);
  activeDeliveryId = signal<number | null>(null);
  gpsActivo = signal(false);
  chatPedidoId = signal<number | null>(null);

  private map: L.Map | null = null;
  private repartidorMarker: L.Marker | null = null;
  private gpsWatchId: number | null = null;
  private destroy$ = new Subject<void>();
  private repartidorId: number | null = null;

  constructor(
    private authService: AuthService,
    private pedidoService: PedidoService,
    private socketService: SocketService,
    private snackBar: MatSnackBar,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    if (!this.authService.hasRole(Rol.REPARTIDOR)) {
      this.router.navigate(['/home']);
      return;
    }

    this.cargarDisponibles();
    this.conectarSocket();

    this.authService.getCurrentRepartidorId().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (id) => {
        this.repartidorId = id;
        this.cargarPedidoActivo();
      },
      error: () => {
        this.cargarPedidoActivo();
      }
    });
  }

  cargarDisponibles(): void {
    this.isLoadingDisponibles.set(true);
    this.pedidoService.findDisponibles().subscribe({
      next: (pedidos) => {
        this.disponibles.set(pedidos as PedidoConRuta[]);
        this.isLoadingDisponibles.set(false);
      },
      error: () => {
        this.isLoadingDisponibles.set(false);
        this.snackBar.open('Error al cargar pedidos disponibles', 'Cerrar', { duration: 3000 });
      },
    });
  }

  private cargarPedidoActivo(): void {
    this.isLoadingMisPedidos.set(true);

    this.pedidoService.findPedidoActivo().pipe(
      catchError(() => of(null))
    ).subscribe({
      next: (activo) => {
        this.misPedidos.set(activo ? [activo as PedidoConRuta] : []);
        this.isLoadingMisPedidos.set(false);

        if (activo) {
          this.onPedidoActivoCargado(activo as PedidoConRuta);
        }
      },
      error: () => {
        this.isLoadingMisPedidos.set(false);
        this.snackBar.open('Error al cargar tu pedido activo', 'Cerrar', { duration: 3000 });
      },
    });
  }

  private onPedidoActivoCargado(pedido: PedidoConRuta): void {
    this.chatPedidoId.set(pedido.id);
    this.socketService.connect();
    this.socketService.joinPedidoRoom(pedido.id);

    if (pedido.estado?.nombre === 'ENRUTA') {
      this.activeDeliveryId.set(pedido.id);
      setTimeout(() => {
        this.initMap(pedido);
        this.iniciarGps(pedido.id);
      }, 300);
    }
  }

  private conectarSocket(): void {
    this.socketService.connect();
    this.socketService
      .onPedidoActualizado()
      .pipe(takeUntil(this.destroy$))
      .subscribe((actualizado: Pedido) => {
        const nombre = actualizado.estado?.nombre?.toUpperCase();

        if (nombre === 'CANCELADO' || nombre === 'ENTREGADO') {
          this.misPedidos.set([]);
          this.activeDeliveryId.set(null);
          this.detenerGps();
          this.destroyMap();
          if (nombre === 'CANCELADO') {
            this.snackBar.open('El pedido fue cancelado', 'OK', { duration: 4000 });
          }
          return;
        }

        this.misPedidos.set([actualizado as PedidoConRuta]);

        if (actualizado.repartidor?.id && !this.repartidorId) {
          this.repartidorId = actualizado.repartidor.id;
        }
      });
  }

  tomarPedido(pedido: PedidoConRuta): void {
    this.pedidoService.tomarPedido(pedido.id).subscribe({
      next: (tomado) => {
        const tomadoRuta = tomado as PedidoConRuta;
        this.disponibles.update((p) => p.filter((x) => x.id !== pedido.id));
        this.misPedidos.set([tomadoRuta]);
        this.chatPedidoId.set(pedido.id);
        this.snackBar.open(`Pedido #${pedido.numero} tomado`, 'OK', { duration: 3000 });
      },
      error: (err) => {
        const msg = err.error?.message || 'No se pudo tomar el pedido';
        this.snackBar.open(msg, 'Cerrar', { duration: 4000 });
      },
    });
  }

  iniciarEntrega(pedido: PedidoConRuta): void {
    this.pedidoService.actualizarEstado(pedido.id, 'ENRUTA').subscribe({
      next: (actualizado) => {
        const actualizadoRuta = { ...pedido, estado: actualizado.estado } as PedidoConRuta;
        this.misPedidos.set([actualizadoRuta]);
        this.activeDeliveryId.set(pedido.id);
        this.socketService.joinPedidoRoom(pedido.id);
        setTimeout(() => {
          this.initMap(pedido);
          this.iniciarGps(pedido.id);
        }, 300);
        this.snackBar.open('Entrega iniciada — GPS activo', 'OK', { duration: 3000 });
      },
      error: () => {
        this.snackBar.open('Error al iniciar la entrega', 'Cerrar', { duration: 3000 });
      },
    });
  }

  marcarEntregado(pedido: PedidoConRuta): void {
    this.pedidoService.actualizarEstado(pedido.id, 'ENTREGADO').subscribe({
      next: () => {
        this.misPedidos.set([]);
        this.activeDeliveryId.set(null);
        this.detenerGps();
        this.destroyMap();
        this.snackBar.open('¡Pedido entregado exitosamente!', 'OK', { duration: 4000 });
      },
      error: () => {
        this.snackBar.open('Error al marcar como entregado', 'Cerrar', { duration: 3000 });
      },
    });
  }

  toggleChat(pedidoId: number) {
    if (this.chatPedidoId() === pedidoId) {
      this.chatPedidoId.set(null);
    } else {
      this.chatPedidoId.set(pedidoId);
    }
  }

  isActiveDelivery(pedidoId: number): boolean {
    return this.activeDeliveryId() === pedidoId;
  }

  getEstadoClass(estadoNombre?: string): string {
    switch (estadoNombre?.toUpperCase()) {
      case 'ASIGNADO':
        return 'chip-asignado';
      case 'ENRUTA':
        return 'chip-enruta';
      case 'ENTREGADO':
        return 'chip-entregado';
      case 'CANCELADO':
      case 'DEMORADO':
        return 'chip-danger';
      default:
        return 'chip-default';
    }
  }

  formatMonto(monto: number): string {
    return monto.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatEstado(nombre?: string): string {
    const map: Record<string, string> = {
      ENRUTA: 'En ruta',
      ENPREPARACION: 'En preparación',
      ASIGNADO: 'Asignado',
      ENTREGADO: 'Entregado',
      CANCELADO: 'Cancelado',
      DEMORADO: 'Demorado',
      CREADO: 'Creado',
      PUBLICADO: 'Publicado',
    };
    return nombre ? (map[nombre] ?? nombre) : '—';
  }

  private initMap(pedido: PedidoConRuta): void {
    if (!pedido.ruta?.origen?.posicion || !pedido.ruta?.destino?.posicion) return;

    const mapEl = document.getElementById('repartidor-map');
    if (!mapEl) return;

    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    const { coordenadaX: ox, coordenadaY: oy } = pedido.ruta.origen.posicion;
    const { coordenadaX: dx, coordenadaY: dy } = pedido.ruta.destino.posicion;

    const start: L.LatLngTuple = [ox, oy];
    const end: L.LatLngTuple = [dx, dy];

    this.map = L.map('repartidor-map', { center: start, zoom: 14 });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);

    L.marker(start)
      .addTo(this.map)
      .bindPopup(`🏪 ${pedido.ruta.origen.calle || 'Origen'}`);

    L.marker(end)
      .addTo(this.map)
      .bindPopup(`🏠 ${pedido.ruta.destino.calle || 'Destino'}`);

    this.repartidorMarker = L.marker(start, {
      icon: L.icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
        iconSize: [40, 40],
        iconAnchor: [20, 40],
      }),
    })
      .addTo(this.map)
      .bindPopup('🚴 Tu posición');

    fetch(
      `https://router.project-osrm.org/route/v1/driving/${oy},${ox};${dy},${dx}?overview=full&geometries=geojson`,
    )
      .then((r) => r.json())
      .then((data: any) => {
        const coords: L.LatLngTuple[] = data.routes[0].geometry.coordinates.map(
          (c: any): L.LatLngTuple => [c[1], c[0]],
        );
        L.polyline(coords, { color: '#6200ea', weight: 5 }).addTo(this.map!);
        this.map!.fitBounds(L.latLngBounds(coords), { padding: [50, 50] });
      })
      .catch((err) => console.error('Error OSRM:', err));

    this.socketService
      .onPosicionActualizada()
      .pipe(takeUntil(this.destroy$))
      .subscribe((coords: { lat: number; lng: number }) => {
        if (this.repartidorMarker) {
          this.repartidorMarker.setLatLng([coords.lat, coords.lng]);
          this.map?.panTo([coords.lat, coords.lng], { animate: true, duration: 0.5 });
        }
      });
  }

  private iniciarGps(pedidoId: number): void {
    if (!navigator.geolocation) {
      this.snackBar.open('GPS no disponible en este dispositivo', 'Cerrar', {
        duration: 3000,
      });
      return;
    }

    this.gpsActivo.set(true);
    this.gpsWatchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        this.socketService.emit('actualizarGps', { pedidoId, lat, lng });
        if (this.repartidorMarker) {
          this.repartidorMarker.setLatLng([lat, lng]);
          this.map?.panTo([lat, lng], { animate: true, duration: 0.5 });
        }
      },
      (err) => console.warn('Error GPS:', err),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 },
    );
  }

  private detenerGps(): void {
    if (this.gpsWatchId !== null) {
      navigator.geolocation.clearWatch(this.gpsWatchId);
      this.gpsWatchId = null;
    }
    this.gpsActivo.set(false);
  }

  private destroyMap(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.repartidorMarker = null;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.detenerGps();
    this.destroyMap();
  }
}
