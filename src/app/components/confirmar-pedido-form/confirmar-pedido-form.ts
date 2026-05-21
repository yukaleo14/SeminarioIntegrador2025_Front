import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { switchMap } from 'rxjs';
import * as L from 'leaflet';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import { CarroService, CartItem } from '../../services/carro-service';
import { PedidoService } from '../../services/pedido-service';
import { FormaPago, FormaPagoService } from '../../services/forma-pago-service';
import { AuthService } from '../../services/auth-service';
import { Sucursal } from '../../models/Sucursal';

interface UbicacionEntrega {
  lat: number;
  lng: number;
  direccion: string;
}

const CORDOBA: [number, number] = [-31.42, -64.18];

@Component({
  selector: 'app-confirmar-pedido-form',
  standalone: true,
  imports: [
    FormsModule,
    CurrencyPipe,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDividerModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './confirmar-pedido-form.html',
  styleUrl: './confirmar-pedido-form.scss',
})
export class ConfirmarPedidoForm implements OnInit, AfterViewInit, OnDestroy {
  @Input({ required: true }) sucursal!: Sucursal;
  @Output() cerrar = new EventEmitter<void>();
  @Output() confirmado = new EventEmitter<{ pedidoId: number }>();

  @ViewChild('mapEl') mapEl!: ElementRef<HTMLDivElement>;

  private carroService = inject(CarroService);
  private pedidoService = inject(PedidoService);
  private formaPagoService = inject(FormaPagoService);
  private authService = inject(AuthService);
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  items = signal<CartItem[]>([]);
  totalPrice = signal(0);

  textoBusqueda = '';
  buscando = signal(false);
  ubicacion = signal<UbicacionEntrega | null>(null);

  formasPago = signal<FormaPago[]>([]);
  formaPagoId = signal<number | null>(null);
  isLoading = signal(false);

  private map?: L.Map;
  private destinoMarker?: L.Marker;

  ngOnInit() {
    this.refresh();
    this.formaPagoService.findAll().subscribe((fp) => this.formasPago.set(fp));
  }

  ngAfterViewInit() {
    this.inicializarMapa();
  }

  ngOnDestroy() {
    this.map?.remove();
  }

  get puedeConfirmar(): boolean {
    return (
      !this.isLoading() &&
      !!this.ubicacion() &&
      !!this.formaPagoId() &&
      this.items().length > 0
    );
  }

  // ── Carrito ──────────────────────────────────────────────────────────

  aumentar(item: CartItem) {
    this.carroService.addProduct(item.producto, 1);
    this.refresh();
  }

  disminuir(item: CartItem) {
    this.carroService.addProduct(item.producto, -1);
    this.refresh();
    if (this.items().length === 0) this.cerrar.emit();
  }

  private refresh() {
    this.items.set(this.carroService.getItems());
    this.totalPrice.set(this.carroService.getTotalPrice());
  }

  // ── Mapa ─────────────────────────────────────────────────────────────

  private sucursalLatLng(): [number, number] {
    const u = this.sucursal?.ubicacion;
    const lat = u?.posicion?.coordenadaX ?? u?.coordenadaX;
    const lng = u?.posicion?.coordenadaY ?? u?.coordenadaY;
    return lat != null && lng != null ? [lat, lng] : CORDOBA;
  }

  private inicializarMapa() {
    const origen = this.sucursalLatLng();
    this.map = L.map(this.mapEl.nativeElement, {
      center: origen,
      zoom: 13,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
    }).addTo(this.map);

    L.marker(origen, { icon: this.pinIcon('#e74c3c'), interactive: false })
      .addTo(this.map)
      .bindTooltip(this.sucursal?.nombre ?? 'Sucursal', { direction: 'top' });

    this.map.on('click', (e: L.LeafletMouseEvent) =>
      this.colocarDestino(e.latlng.lat, e.latlng.lng),
    );

    // El contenedor puede montarse dentro de un diálogo/sheet animado:
    // recalcular el tamaño una vez visible.
    setTimeout(() => this.map?.invalidateSize(), 200);
  }

  private colocarDestino(lat: number, lng: number) {
    if (!this.map) return;
    if (this.destinoMarker) {
      this.destinoMarker.setLatLng([lat, lng]);
    } else {
      this.destinoMarker = L.marker([lat, lng], {
        draggable: true,
        icon: this.pinIcon('#6c5ce7'),
      }).addTo(this.map);
      this.destinoMarker.on('dragend', () => {
        const p = this.destinoMarker!.getLatLng();
        this.reverseGeocode(p.lat, p.lng);
      });
    }
    this.reverseGeocode(lat, lng);
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

  buscarDireccion() {
    const q = this.textoBusqueda.trim();
    if (!q) return;
    this.buscando.set(true);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1&addressdetails=1`;
    this.http.get<{ lat: string; lon: string }[]>(url).subscribe({
      next: (res) => {
        this.buscando.set(false);
        if (!res.length) {
          this.snackBar.open('No encontramos esa dirección.', 'OK', { duration: 3000 });
          return;
        }
        const lat = +res[0].lat;
        const lng = +res[0].lon;
        this.map?.setView([lat, lng], 16);
        this.colocarDestino(lat, lng);
      },
      error: () => {
        this.buscando.set(false);
        this.snackBar.open('Error al buscar la dirección.', 'OK', { duration: 3000 });
      },
    });
  }

  private reverseGeocode(lat: number, lng: number) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    // Fijamos coordenadas de inmediato; la dirección textual llega luego.
    this.ubicacion.set({ lat, lng, direccion: 'Ubicación seleccionada' });
    this.http.get<{ display_name?: string }>(url).subscribe({
      next: (data) => {
        if (data?.display_name) {
          this.ubicacion.set({ lat, lng, direccion: data.display_name });
          this.textoBusqueda = data.display_name;
        }
      },
    });
  }

  // ── Confirmar ────────────────────────────────────────────────────────

  confirmar() {
    const userId = this.authService.getCurrentUserId();
    const ubi = this.ubicacion();
    const fpId = this.formaPagoId();
    const itemsActuales = this.carroService.getItems();

    if (!userId) {
      this.snackBar.open('Debés iniciar sesión para confirmar tu pedido.', 'OK', { duration: 4000 });
      return;
    }
    if (!ubi || !fpId || !itemsActuales.length) return;

    const empresaId = this.sucursal?.empresaId ?? this.sucursal?.empresa?.id;
    if (empresaId == null) {
      this.snackBar.open('No pudimos identificar la sucursal. Recargá e intentá de nuevo.', 'OK', { duration: 4000 });
      return;
    }

    this.isLoading.set(true);
    const [origenLat, origenLng] = this.sucursalLatLng();

    this.pedidoService
      .crearPago({
        numero: `PAG-${Date.now()}`,
        monto: this.totalPrice(),
        formaPagoId: fpId,
      })
      .pipe(
        switchMap((pago) =>
          this.pedidoService.crearPedido({
            numero: `PED-${Date.now()}`,
            horaLlegadaEstimada: new Date(Date.now() + 45 * 60_000).toISOString(),
            montoTotal: this.totalPrice(),
            tiempoPreparacionEstimado: 30,
            tiempoRepartoEstimado: 20,
            fechaHora: new Date().toISOString(),
            empresaId,
            compradorId: userId,
            pagoId: pago.id,
            infoRuta: {
              origen: {
                coordenadas: { lat: origenLat, lng: origenLng },
                calle: this.sucursal.nombre,
              },
              destino: {
                coordenadas: { lat: ubi.lat, lng: ubi.lng },
                calle: ubi.direccion,
              },
            },
            detalle: itemsActuales.map((i) => ({
              productoId: i.producto.id,
              cantidad: i.cantidad,
              montoSubtotal: i.producto.precio * i.cantidad,
            })),
          }),
        ),
      )
      .subscribe({
        next: (pedido) => {
          this.carroService.clear();
          this.confirmado.emit({ pedidoId: pedido.id });
          this.snackBar
            .open('¡Pedido confirmado!', 'Ver seguimiento', { duration: 5000 })
            .onAction()
            .subscribe(() => this.router.navigate(['/seguimiento', pedido.id]));
          this.router.navigate(['/seguimiento', pedido.id]);
        },
        error: (err) => {
          console.error('Error al confirmar pedido:', err);
          this.snackBar.open('Error al confirmar el pedido. Intentá nuevamente.', 'OK', { duration: 5000 });
          this.isLoading.set(false);
        },
      });
  }

  onCerrar() {
    this.cerrar.emit();
  }
}
