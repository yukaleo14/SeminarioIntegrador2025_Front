import { Component, AfterViewInit, ChangeDetectorRef, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import * as L from 'leaflet';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-seleccion-ubicaciones',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './seleccion-ubicaciones.html',
  styleUrl: './seleccion-ubicaciones.scss'
})
export class SeleccionUbicaciones implements AfterViewInit, OnDestroy {

  @Input() sucursalLatLng?: [number, number]; // [lat, lng]
  @Input() sucursalNombre?: string = 'sucursal';

  @Output() ubicacionSeleccionada = new EventEmitter
  <{ lat: number, lng: number, direccion: string }>();

  map!: L.Map;
  usermarker!: L.Marker;
  sucursalMarker!: L.Marker;

  textoBusqueda: string = '';
  direccionEncontrada: string = '';

  // ultimaPosicionMarcador: L.LatLng | null = null;

  private destroy$ = false;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef   // <<--- IMPORTANTE
  ) {}

  ngAfterViewInit(): void {
    this.inicializarMapa();
  }

  ngOnDestroy(): void {
    this.destroy$ = true;
    if (this.map) {
      this.map.remove();
    }
  }

  private inicializarMapa() {
    this.map = L.map('map').setView([-31.42, -64.18], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    const userIcon = L.icon({
      iconUrl: 'https://cdn-icons-png.flaticon.com/512/64/64113.png',
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40],
    });

    this.usermarker = L.marker([-31.42, -64.18], { draggable: true, icon: userIcon }).addTo(this.map);

    this.usermarker.on('dragend', () => {
      const pos = this.usermarker.getLatLng();
      this.obtenerDireccion(pos.lat, pos.lng, true);
    });

    if (this.sucursalLatLng) {
      this.sucursalMarker = L.marker(this.sucursalLatLng, { icon: L.icon({
        iconUrl: 'assets/sucursal-icon.png',
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      }) }).addTo(this.map).bindPopup(this.sucursalNombre || 'Sucursal').openPopup();
    }
  }

  buscarPorTexto() {
    if (!this.textoBusqueda.trim()) return;

    // const url = `https://nominatim.openstreetmap.org/search?format=json&q=${this.textoBusqueda}`;

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(this.textoBusqueda)}&limit=1`;

    // this.http.get<any[]>(url).subscribe(result => {
    //   if (result.length > 0) {
    //     const { lat, lon } = result[0];

    //     this.actualizarMapaPorBusqueda(Number(lat), Number(lon));

    //     // Reverse geocoding para mostrar la dirección real
    //     this.obtenerDireccion(Number(lat), Number(lon), false);
    //   }
    // });

    this.http.get<any[]>(url).subscribe({
      next: result => {
        if (result.length > 0) {
          const lat = Number(result[0].lat);
          const lon = Number(result[0].lon);
          this.actualizarMapaPorBusqueda(lat, lon);
          this.obtenerDireccion(lat, lon, false);
        }
      },
      error: err => {
        console.error('Error al buscar ubicación:', err);
      }
    });
  }

  actualizarMapaPorBusqueda(lat: number, lng: number) {
    this.map.setView([lat, lng], 16);
    this.usermarker.setLatLng([lat, lng]);
    // this.ultimaPosicionMarcador = new L.LatLng(lat, lng);
  }

  obtenerDireccion(lat: number, lng: number, actualizarInput: boolean = false) {
    // const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;

    this.http.get<any>(url).subscribe({
      next: data => {
         if (data?.display_name) {
        this.direccionEncontrada = data.display_name;
        if (actualizarInput) {
          this.textoBusqueda = data.display_name;
        }
        this.ubicacionSeleccionada.emit({ lat, lng, direccion: this.direccionEncontrada });
        // FORZAR A ANGULAR A ACTUALIZAR HTML
        this.cdr.detectChanges(); 
    }}
    });
  }
}
