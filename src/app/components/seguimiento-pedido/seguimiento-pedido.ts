import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';
import { Subject, takeUntil } from 'rxjs';
import { SocketService } from '../../services/socket.service';
import { ActivatedRoute } from '@angular/router';
import { PedidoService } from '../../services/pedido-service';

@Component({
  selector: 'app-seguimiento-pedido',
  imports: [],
  templateUrl: './seguimiento-pedido.html',
  styleUrl: './seguimiento-pedido.scss'
})
export class SeguimientoPedido implements AfterViewInit, OnDestroy {
  private map!: L.Map;
  private clienteMarker!: L.Marker;
  private comercioMarker!: L.Marker;
  private repartidorMarker!: L.Marker;
  private rutaPolyline!: L.Polyline;

  private intervalId: any;
  
  private routeCoords: L.LatLngTuple[] = [];
  private tiempoRestante = 0; // en minutos

  private destroy$ = new Subject<void>();

  private pedidoId!: number;
  private datosPedido: any;

  constructor(
    private http: HttpClient,
    private socketService: SocketService,
    private route: ActivatedRoute,
    private pedidoService: PedidoService
  ) {
    this.pedidoId = Number(this.route.snapshot.paramMap.get('pedidoId'));
  }

  ngAfterViewInit(): void {
    this.initMap();
    // this.trazarRutaInicial();
    this.escucharGpsRepartiddo();
    this.obtenerRutaYMostrar();
    // this.simularMovimiento();
  }


  private initMap(): void {
    this.map = L.map('map', {
      center: [-32.4105, -63.2436],
      zoom: 15
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);
  }

  private escucharGpsRepartiddo(): void {

    const pedidoId = 123; // Este ID debería venir dinámicamente, quizás como input o desde la ruta
    this.socketService.connect();
    this.socketService.emit('joinPedidoRoom', { pedidoId });
    
    this.socketService.on('posicionActualizada', (coordenadas: any) => {
      const nuevaPosicion: L.LatLngTuple = [coordenadas.lat, coordenadas.lng];
      if (this.repartidorMarker) {
        this.repartidorMarker.setLatLng(nuevaPosicion);
        this.map.panTo(nuevaPosicion, { animate: true, duration: 0.5 });
      }
    });
  }

  private obtenerRutaYMostrar(): void {
    const start: L.LatLngTuple = [-32.4098, -63.2455]; // Comercio
    const end: L.LatLngTuple = [-32.4123, -63.2405];   // Cliente
    const pedidoId = 123; // Este ID debería venir dinámicamente, quizás como input o desde la ruta



    const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;

    this.http.get(url).subscribe({
      next: (data: any) => {
        // Guardamos la ruta
        this.routeCoords = data.routes[0].geometry.coordinates.map(
          (c: any): L.LatLngTuple => [c[1], c[0]]
        );

        const distance = (data.routes[0].distance / 1000).toFixed(2);
        this.tiempoRestante = Math.round(data.routes[0].duration / 60);
        console.log(`Distancia: ${distance} km | Tiempo estimado: ${this.tiempoRestante} min`);


        this.map.eachLayer((layer) => {
          if (layer instanceof L.Marker || layer instanceof L.Polyline) {
            this.map.removeLayer(layer);
          }
        });

        L.polyline(this.routeCoords, { color: 'blue', weight: 4 }).addTo(this.map);

        // Marcadores
        this.comercioMarker = L.marker(start)
          .addTo(this.map)
          .bindPopup(`🍕  'Comercio (Pizzería Don Pepe)'}`)
          .openPopup();

        this.clienteMarker = L.marker(end)
          .addTo(this.map)
          .bindPopup(`🏠 'Cliente (Entrega en casa)'}`);

        this.repartidorMarker = L.marker(start, {
          icon: L.icon({
            iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
            iconSize: [40, 40],
            iconAnchor: [20, 40]
          })
        }).addTo(this.map)
          .bindPopup(`🚴‍♂️ Repartidor — ETA: ${this.tiempoRestante} min`);

        // Ajustar vista
        const bounds = L.latLngBounds(this.routeCoords);
        this.map.fitBounds(bounds);

        this.socketService.emit('joinPedidoRoom', { pedidoId });
        this.escucharGpsReal();

        // Iniciar animación del repartidor
        this.simularEmisionGpsPorSocket(pedidoId);
      },
      error: (err) => console.error('Error obteniendo ruta OSRM:', err)
    });
  }

  private escucharGpsReal(): void {
    this.socketService.onPosicionActualizada().pipe(takeUntil(this.destroy$)).subscribe((coordenadas: { lat: number; lng: number }) => {
      const nuevaPosicion: L.LatLngTuple = [coordenadas.lat, coordenadas.lng];

      if (this.repartidorMarker) {
        this.repartidorMarker.setLatLng(nuevaPosicion);
        this.map.panTo(nuevaPosicion, { animate: true, duration: 0.5 });
      }
    });
  }

  private simularEmisionGpsPorSocket(pedidoId: number): void {
    let i = 0;
    const totalPuntos = this.routeCoords.length;
    const velocidad = 750; // ms por paso, ajusta para acelerar/reducir velocidad

    this.intervalId = setInterval(() => {
      if (i >= totalPuntos) {
        clearInterval(this.intervalId);
        this.repartidorMarker.bindPopup('✅ Pedido entregado').openPopup();
        return;
      }

      const puntoActual = this.routeCoords[i];
      this.socketService.emit('actualizarGps', { pedidoId, lat: puntoActual[0], lng: puntoActual[1] });

      const porcentaje = i / totalPuntos;
      const tiempoActual = Math.round(this.tiempoRestante * (1 - porcentaje));
      this.repartidorMarker.bindPopup(`🚴‍♂️ En camino — ETA: ${tiempoActual} min`)
      
      i++;
    }, velocidad);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.map) {
      this.map.remove();
    }
  }
}
