import { Component, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import * as L from 'leaflet';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-seleccion-ubicaciones',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './seleccion-ubicaciones.html',
  styleUrl: './seleccion-ubicaciones.scss'
})
export class SeleccionUbicaciones implements AfterViewInit {

  map!: L.Map;
  marker!: L.Marker;
  textoBusqueda: string = '';
  direccionEncontrada: string = '';
  ultimaPosicionMarcador: L.LatLng | null = null;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef   // <<--- IMPORTANTE
  ) {}

  ngAfterViewInit(): void {
    this.inicializarMapa();
  }

  inicializarMapa() {
    this.map = L.map('map').setView([-34.6037, -58.3816], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(this.map);

    this.marker = L.marker([-34.6037, -58.3816], { draggable: true }).addTo(this.map);

    this.marker.on('dragend', () => {
      const pos = this.marker.getLatLng();
      this.ultimaPosicionMarcador = pos;
      this.obtenerDireccion(pos.lat, pos.lng, true);
    });
  }

  buscarPorTexto() {
    if (!this.textoBusqueda.trim()) return;

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${this.textoBusqueda}`;

    this.http.get<any[]>(url).subscribe(result => {
      if (result.length > 0) {
        const { lat, lon } = result[0];

        this.actualizarMapaPorBusqueda(Number(lat), Number(lon));

        // Reverse geocoding para mostrar la dirección real
        this.obtenerDireccion(Number(lat), Number(lon), false);
      }
    });
  }

  actualizarMapaPorBusqueda(lat: number, lng: number) {
    this.map.setView([lat, lng], 16);
    this.marker.setLatLng([lat, lng]);
    this.ultimaPosicionMarcador = new L.LatLng(lat, lng);
  }

  obtenerDireccion(lat: number, lng: number, actualizarInput: boolean) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;

    this.http.get<any>(url).subscribe(data => {
      if (data && data.display_name) {
        this.direccionEncontrada = data.display_name;

        if (actualizarInput) {
          this.textoBusqueda = data.display_name;
        }

        // FORZAR A ANGULAR A ACTUALIZAR HTML
        this.cdr.detectChanges();
      }
    });
  }
}
