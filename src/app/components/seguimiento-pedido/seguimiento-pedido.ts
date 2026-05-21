import { AfterViewInit, Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';
import { Subject, takeUntil } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { SocketService } from '../../services/socket.service';
import { PedidoService } from '../../services/pedido-service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-seguimiento-pedido',
  standalone: true, // Asumiendo que es standalone por tu 'imports: []'
  imports: [CommonModule], // Asegúrate de importar CommonModule si usas *ngIf, *ngFor, etc.
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
  
  // Las hacemos públicas para poder mostrarlas en el HTML
  tiempoRestante = 0; 
  datosPedido: any = null;

  private destroy$ = new Subject<void>();
  private pedidoId!: number;

  constructor(
    private http: HttpClient,
    private socketService: SocketService,
    private route: ActivatedRoute,
    private pedidoService: PedidoService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Obtenemos el ID de la URL (/seguimiento/123)
    this.pedidoId = Number(this.route.snapshot.paramMap.get('pedidoId'));
  }

  ngAfterViewInit(): void {
    this.initMap();
    this.cargarDatosPedido();
  }

  private initMap(): void {
    this.map = L.map('map', {
      center: [-32.4105, -63.2436], // Centro de Villa María por defecto
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
        // 1. Imprimimos el pedido para ver qué trajo realmente la BD
        console.log('📦 Pedido recibido desde la BD:', pedido);

        // 2. Validación de seguridad para evitar que la app crashee
        if (!pedido || !pedido.ruta || !pedido.ruta.origen || !pedido.ruta.destino) {
          console.error('❌ Error: El pedido no tiene la estructura infoRuta completa.', pedido);
          // Opcional: podrías mostrar un snackbar aquí avisando del error
          return; // Cortamos la ejecución para no intentar dibujar un mapa sin coordenadas
        }

        this.datosPedido = pedido;
        this.cdr.detectChanges();

        // 3. Extraemos las coordenadas de forma segura
        const coordsOrigen = pedido.ruta.origen.posicion;
        const coordsDestino = pedido.ruta.destino.posicion;

        const start: L.LatLngTuple = [coordsOrigen.coordenadaX, coordsOrigen.coordenadaY];
        const end: L.LatLngTuple = [coordsDestino.coordenadaX, coordsDestino.coordenadaY];

        this.obtenerRutaYMostrar(start, end);
      },
      error: (err) => console.error('Error al cargar el pedido:', err)
    });
  }

  private obtenerRutaYMostrar(start: L.LatLngTuple, end: L.LatLngTuple): void {
    // Atención: OSRM usa formato [longitud, latitud]
    const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;

    // Usamos fetch nativo de JavaScript para que el AuthInterceptor de Angular NO agregue el token aquí
    fetch(url)
      .then(response => {
        if (!response.ok) throw new Error('Error en la respuesta de OSRM');
        return response.json();
      })
      .then((data: any) => {
        // Convertimos las coordenadas de OSRM [lng, lat] al formato Leaflet [lat, lng]
        this.routeCoords = data.routes[0].geometry.coordinates.map(
          (c: any): L.LatLngTuple => [c[1], c[0]]
        );

        this.tiempoRestante = Math.round(data.routes[0].duration / 60);

        // Dibujar ruta
        this.rutaPolyline = L.polyline(this.routeCoords, { color: '#3498db', weight: 5 }).addTo(this.map);

        // Nombres dinámicos para los popups
        const nombreSucursal = this.datosPedido.ruta.origen.calle;
        const calleDestino = this.datosPedido.ruta.destino.calle;

        this.comercioMarker = L.marker(start)
          .addTo(this.map)
          .bindPopup(`🏪 <b>${nombreSucursal}</b>`);

        this.clienteMarker = L.marker(end)
          .addTo(this.map)
          .bindPopup(`🏠 <b>${calleDestino}</b>`);

        this.repartidorMarker = L.marker(start, {
          icon: L.icon({
            iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
            iconSize: [40, 40],
            iconAnchor: [20, 40]
          })
        }).addTo(this.map)
          .bindPopup(`🚴‍♂️ ETA: ${this.tiempoRestante} min`);

        // Ajustar vista para que quepan ambos puntos
        const bounds = L.latLngBounds(this.routeCoords);
        this.map.fitBounds(bounds, { padding: [50, 50] });

        // Conectamos Socket y empezamos simulación
        this.socketService.connect();
        this.socketService.emit('joinPedidoRoom', { pedidoId: this.pedidoId });
        this.escucharGpsReal();
        this.simularEmisionGpsPorSocket();
        
        // Forzamos actualización de la vista por si el tiempo estimado tardó en llegar
        this.cdr.detectChanges(); 
      })
      .catch(err => console.error('Error obteniendo ruta OSRM:', err));
  }

  private escucharGpsReal(): void {
    // Asegurate de usar el nombre correcto del evento ('posicionActualizada' o tu método 'onPosicionActualizada()')
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
    const velocidad = 800; // milisegundos por paso, bajalo para que el repartidor vaya más rápido

    this.intervalId = setInterval(() => {
      if (i >= totalPuntos) {
        clearInterval(this.intervalId);
        this.repartidorMarker.bindPopup('✅ <b>¡Pedido entregado!</b>').openPopup();
        return;
      }

      const puntoActual = this.routeCoords[i];
      
      // Emitimos al socket para simular que el celu del repartidor envía la data
      this.socketService.emit('actualizarGps', { 
        pedidoId: this.pedidoId, 
        lat: puntoActual[0], 
        lng: puntoActual[1] 
      });

      // Calcular tiempo restante visual
      const porcentaje = i / totalPuntos;
      const tiempoActual = Math.round(this.tiempoRestante * (1 - porcentaje));
      
      // Actualizamos el tooltip solo cada cierto tiempo para no saturar
      if (i % 5 === 0) { 
        this.repartidorMarker.bindPopup(`🚴‍♂️ En camino — ETA: ${tiempoActual} min`);
      }
      
      i++;
    }, velocidad);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    // Matamos el intervalo si el usuario cambia de pantalla antes de que llegue el pedido
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    if (this.map) {
      this.map.remove();
    }
  }
}