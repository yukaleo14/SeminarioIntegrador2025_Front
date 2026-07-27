import { AfterViewInit, Component, OnDestroy, OnInit, ChangeDetectorRef, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';
import { Subject, takeUntil } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { SocketService } from '../../services/socket.service';
import { PedidoService } from '../../services/pedido-service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { Chat } from '../chat/chat';

@Component({
  selector: 'app-seguimiento-pedido',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, RouterLink, Chat],
  templateUrl: './seguimiento-pedido.html',
  styleUrl: './seguimiento-pedido.scss'
})
export class SeguimientoPedido implements OnInit, AfterViewInit, OnDestroy {
  private map!: L.Map;
  private clienteMarker!: L.Marker;
  private comercioMarker!: L.Marker;
  private repartidorMarker!: L.Marker;
  private rutaPolyline!: L.Polyline;

  private intervalId: any;
  private routeCoords: L.LatLngTuple[] = [];
  private simulacionIniciada = false;

  tiempoRestante = 0;
  datosPedido: any = null;
  estadoActual: string = '';
  chatAbierto = signal(false);

  private readonly ESTADO_ORDER = [
    'CREADO', 'ENPREPARACION', 'ASIGNADO', 'ENRUTA', 'ENTREGADO',
  ];

  isPastOrCurrent(estado: string): boolean {
    const current = this.ESTADO_ORDER.indexOf(this.estadoActual);
    const target = this.ESTADO_ORDER.indexOf(estado);
    return current >= target && target !== -1;
  }

  isPast(estado: string): boolean {
    const current = this.ESTADO_ORDER.indexOf(this.estadoActual);
    const target = this.ESTADO_ORDER.indexOf(estado);
    return current > target && target !== -1;
  }

  private destroy$ = new Subject<void>();
  pedidoId!: number;

  constructor(
    private http: HttpClient,
    private socketService: SocketService,
    private route: ActivatedRoute,
    private pedidoService: PedidoService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  get chatDisponible(): boolean {
    return this.estadoActual === 'ASIGNADO' || this.estadoActual === 'ENRUTA';
  }

  toggleChat() {
    this.chatAbierto.update(v => !v);
  }

  ngOnInit(): void {
    this.pedidoId = Number(this.route.snapshot.paramMap.get('pedidoId'));
  }

  ngAfterViewInit(): void {
    this.initMap();
    this.cargarDatosPedido();
  }

  private initMap(): void {
    this.map = L.map('map', {
      center: [-32.4105, -63.2436],
      zoom: 14
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);
  }

  private cargarDatosPedido(): void {
    this.pedidoService.findOne(this.pedidoId).subscribe({
      next: (pedido: any) => {
        if (!pedido?.ruta?.origen?.posicion || !pedido?.ruta?.destino?.posicion) {
          console.error('El pedido no tiene ruta completa:', pedido);
          return;
        }

        this.datosPedido = pedido;
        this.estadoActual = pedido.estado?.nombre ?? '';
        this.cdr.detectChanges();

        const coordsOrigen = pedido.ruta.origen.posicion;
        const coordsDestino = pedido.ruta.destino.posicion;

        const start: L.LatLngTuple = [coordsOrigen.coordenadaX, coordsOrigen.coordenadaY];
        const end: L.LatLngTuple = [coordsDestino.coordenadaX, coordsDestino.coordenadaY];

        this.obtenerRutaYMostrar(start, end);

        // Listen for state changes on this pedido's room
        this.socketService.connect();
        this.socketService.emit('joinPedidoRoom', { pedidoId: this.pedidoId });
        this.escucharGpsReal();
        this.escucharCambiosEstado();
      },
      error: (err) => console.error('Error al cargar el pedido:', err)
    });
  }

  private obtenerRutaYMostrar(start: L.LatLngTuple, end: L.LatLngTuple): void {
    const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;

    fetch(url)
      .then(response => {
        if (!response.ok) throw new Error('Error en la respuesta de OSRM');
        return response.json();
      })
      .then((data: any) => {
        this.routeCoords = data.routes[0].geometry.coordinates.map(
          (c: any): L.LatLngTuple => [c[1], c[0]]
        );

        this.tiempoRestante = Math.round(data.routes[0].duration / 60);

        this.rutaPolyline = L.polyline(this.routeCoords, { color: '#3498db', weight: 5 }).addTo(this.map);

        const nombreSucursal = this.datosPedido?.ruta?.origen?.calle ?? 'Origen';
        const calleDestino = this.datosPedido?.ruta?.destino?.calle ?? 'Destino';

        this.comercioMarker = L.marker(start)
          .addTo(this.map)
          .bindPopup(`🏪 <b>${nombreSucursal}</b>`);

        this.clienteMarker = L.marker(end)
          .addTo(this.map)
          .bindPopup(`🏠 <b>${calleDestino}</b>`);

        const bounds = L.latLngBounds(this.routeCoords);
        this.map.fitBounds(bounds, { padding: [50, 50] });

        // Only add the repartidor marker and start simulation if already ENRUTA
        if (this.estadoActual === 'ENRUTA') {
          this.iniciarSeguimientoRepartidor(start);
        }

        this.cdr.detectChanges();
      })
      .catch(err => console.error('Error obteniendo ruta OSRM:', err));
  }

  private iniciarSeguimientoRepartidor(start: L.LatLngTuple): void {
    if (this.simulacionIniciada) return;
    this.simulacionIniciada = true;

    this.repartidorMarker = L.marker(start, {
      icon: L.icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
        iconSize: [40, 40],
        iconAnchor: [20, 40]
      })
    }).addTo(this.map)
      .bindPopup(`🚴‍♂️ ETA: ${this.tiempoRestante} min`);

    this.simularEmisionGpsPorSocket();
  }

  private escucharCambiosEstado(): void {
    this.socketService.onPedidoActualizado().pipe(takeUntil(this.destroy$)).subscribe((actualizado: any) => {
      if (actualizado.id !== this.pedidoId) return;

      const nuevoEstado: string = actualizado.estado?.nombre ?? '';
      this.estadoActual = nuevoEstado;
      this.cdr.detectChanges();

      if (nuevoEstado === 'ENRUTA' && this.routeCoords.length && !this.simulacionIniciada) {
        const start = this.routeCoords[0];
        this.iniciarSeguimientoRepartidor(start);
      }
    });
  }

  private escucharGpsReal(): void {
    this.socketService.onPosicionActualizada().pipe(takeUntil(this.destroy$)).subscribe((coordenadas: any) => {
      const nuevaPosicion: L.LatLngTuple = [coordenadas.lat, coordenadas.lng];
      if (this.repartidorMarker) {
        this.repartidorMarker.setLatLng(nuevaPosicion);
        this.map.panTo(nuevaPosicion, { animate: true, duration: 0.5 });
      }
    });
  }

  private simularEmisionGpsPorSocket(): void {
    let i = 0;
    const totalPuntos = this.routeCoords.length;
    const velocidad = 800;

    this.intervalId = setInterval(() => {
      if (i >= totalPuntos) {
        clearInterval(this.intervalId);
        if (this.repartidorMarker) {
          this.repartidorMarker.bindPopup('✅ <b>¡Pedido entregado!</b>').openPopup();
        }
        return;
      }

      const puntoActual = this.routeCoords[i];

      this.socketService.emit('actualizarGps', {
        pedidoId: this.pedidoId,
        lat: puntoActual[0],
        lng: puntoActual[1]
      });

      const porcentaje = i / totalPuntos;
      const tiempoActual = Math.round(this.tiempoRestante * (1 - porcentaje));

      if (i % 5 === 0 && this.repartidorMarker) {
        this.repartidorMarker.bindPopup(`🚴‍♂️ En camino — ETA: ${tiempoActual} min`);
      }

      i++;
    }, velocidad);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    if (this.map) {
      this.map.remove();
    }
  }
}
