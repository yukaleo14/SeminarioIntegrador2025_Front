import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';

@Component({
  selector: 'app-seguimiento-pedido',
  templateUrl: './seguimiento-pedido.html',
  styleUrl: './seguimiento-pedido.scss'
})
export class SeguimientoPedido implements AfterViewInit, OnDestroy {
  private map!: L.Map;
  private clienteMarker!: L.Marker;
  private comercioMarker!: L.Marker;
  private repartidorMarker!: L.Marker;
  private intervalId: any;
  private routeCoords: L.LatLngTuple[] = [];
  private tiempoRestante = 0; // en minutos

  constructor(private http: HttpClient) {}

  ngAfterViewInit(): void {
    this.initMap();
    this.obtenerRutaYMostrar();
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

  private obtenerRutaYMostrar(): void {
    const start: L.LatLngTuple = [-32.4098, -63.2455]; // Comercio
    const end: L.LatLngTuple = [-32.4123, -63.2405];   // Cliente

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

        // Dibujar ruta
        L.polyline(this.routeCoords, { color: 'blue', weight: 4 }).addTo(this.map);

        // Marcadores
        this.comercioMarker = L.marker(start)
          .addTo(this.map)
          .bindPopup('🍕 Comercio (Pizzería Don Pepe)')
          .openPopup();

        this.clienteMarker = L.marker(end)
          .addTo(this.map)
          .bindPopup('🏠 Cliente (Entrega en casa)');

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

        // Iniciar animación del repartidor
        this.simularMovimiento();
      },
      error: (err) => console.error('Error obteniendo ruta OSRM:', err)
    });
  }

  private simularMovimiento(): void {
    let i = 0;
    const totalPuntos = this.routeCoords.length;
    const velocidad = 500; // ms por paso, ajusta para acelerar/reducir velocidad

    this.intervalId = setInterval(() => {
      if (i >= totalPuntos) {
        clearInterval(this.intervalId);
        this.repartidorMarker.bindPopup('✅ Pedido entregado').openPopup();
        return;
      }

      // Mover repartidor
      this.repartidorMarker.setLatLng(this.routeCoords[i]);

      // Actualizar tiempo restante dinámicamente
      const porcentaje = i / totalPuntos;
      const tiempoActual = Math.round(this.tiempoRestante * (1 - porcentaje));
      this.repartidorMarker.bindPopup(`🚴‍♂️ En camino — ETA: ${tiempoActual} min`);

      i++;
    }, velocidad);
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }
}
