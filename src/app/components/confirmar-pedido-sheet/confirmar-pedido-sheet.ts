import {
  Component,
  inject,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { switchMap } from 'rxjs';
import { CurrencyPipe } from '@angular/common';

import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatStepperModule, MatStepper } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatListModule } from '@angular/material/list';

import { CarroService, CartItem } from '../../services/carro-service';
import { PedidoService } from '../../services/pedido-service';
import { FormaPago, FormaPagoService } from '../../services/forma-pago-service';
import { AuthService } from '../../services/auth-service';
import { Sucursal } from '../../models/Sucursal';

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

@Component({
  selector: 'app-confirmar-pedido-sheet',
  standalone: true,
  imports: [
    FormsModule,
    CurrencyPipe,
    MatStepperModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatListModule,
  ],
  templateUrl: './confirmar-pedido-sheet.html',
  styleUrl: './confirmar-pedido-sheet.scss',
})
export class ConfirmarPedidoSheet implements OnInit {
  @ViewChild('stepper') stepper!: MatStepper;

  private sheetRef = inject(MatBottomSheetRef<ConfirmarPedidoSheet>);
  private carroService = inject(CarroService);
  private pedidoService = inject(PedidoService);
  private formaPagoService = inject(FormaPagoService);
  private authService = inject(AuthService);
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  sucursal = inject<{ sucursal: Sucursal }>(MAT_BOTTOM_SHEET_DATA).sucursal;

  // Step 1 – items
  items = signal<CartItem[]>([]);
  totalPrice = signal(0);

  // Step 2 – dirección
  textoBusqueda = '';
  buscando = signal(false);
  resultados = signal<NominatimResult[]>([]);
  ubicacion = signal<{ lat: number; lng: number; direccion: string } | null>(null);

  // Step 3 – pago
  formasPago = signal<FormaPago[]>([]);
  formaPagoId = signal<number | null>(null);
  isLoading = signal(false);

  ngOnInit() {
    this.refresh();
    this.formaPagoService.findAll().subscribe((fp) => this.formasPago.set(fp));
  }

  // ── Step 1 helpers ──────────────────────────────────────────────────

  aumentar(item: CartItem) {
    this.carroService.addProduct(item.producto, 1);
    this.refresh();
  }

  disminuir(item: CartItem) {
    this.carroService.addProduct(item.producto, -1);
    this.refresh();
    if (this.items().length === 0) this.sheetRef.dismiss();
  }

  private refresh() {
    this.items.set(this.carroService.getItems());
    this.totalPrice.set(this.carroService.getTotalPrice());
  }

  // ── Step 2 helpers ──────────────────────────────────────────────────

  buscarDireccion() {
    const q = this.textoBusqueda.trim();
    if (!q) return;
    this.buscando.set(true);
    this.resultados.set([]);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&addressdetails=1`;
    this.http.get<NominatimResult[]>(url).subscribe({
      next: (res) => {
        this.buscando.set(false);
        this.resultados.set(res);
      },
      error: () => this.buscando.set(false),
    });
  }

  seleccionarResultado(r: NominatimResult) {
    this.ubicacion.set({ lat: +r.lat, lng: +r.lon, direccion: r.display_name });
    this.resultados.set([]);
    this.textoBusqueda = r.display_name.slice(0, 60);
  }

  // ── Confirmar ────────────────────────────────────────────────────────

  confirmar() {
    const userId = this.authService.getCurrentUserId();
    const ubi = this.ubicacion();
    const fpId = this.formaPagoId();
    const itemsActuales = this.carroService.getItems();

    if (!userId || !ubi || !fpId || !itemsActuales.length) return;

    this.isLoading.set(true);

    const pagoData = {
      numero: `PAG-${Date.now()}`,
      monto: this.totalPrice(),
      formaPagoId: fpId,
    };

    this.pedidoService
      .crearPago(pagoData)
      .pipe(
        switchMap((pago) => {
          const pedidoData = {
            numero: `PED-${Date.now()}`,
            horaLlegadaEstimada: new Date(Date.now() + 45 * 60_000).toISOString(),
            montoTotal: this.totalPrice(),
            tiempoPreparacionEstimado: 30,
            tiempoRepartoEstimado: 20,
            fechaHora: new Date().toISOString(),
            empresaId: this.sucursal.empresaId,
            compradorId: userId,
            pagoId: pago.id,
            infoRuta: {
              origen: {
                coordenadas: {
                  lat: this.sucursal.ubicacion?.posicion?.coordenadaX ?? -31.42,
                  lng: this.sucursal.ubicacion?.posicion?.coordenadaY ?? -64.18,
                },
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
          };
          return this.pedidoService.crearPedido(pedidoData);
        }),
      )
      .subscribe({
        next: (pedido) => {
          this.carroService.clear();
          this.sheetRef.dismiss({ pedidoId: pedido.id });
          this.snackBar.open('¡Pedido confirmado!', 'Ver seguimiento', { duration: 5000 })
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

  cerrar() {
    this.sheetRef.dismiss();
  }
}
