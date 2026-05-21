import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CarroService, CartItem } from '../services/carro-service';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth-service';
import { PedidoService } from '../services/pedido-service';
import { FormaPagoService, FormaPago } from '../services/forma-pago-service';
import { SucursalService } from '../services/sucursal-service';
import { Sucursal } from '../models/Sucursal';
import { Subscription, switchMap } from 'rxjs';
import { SeleccionUbicaciones } from '../components/seleccion-ubicaciones/seleccion-ubicaciones';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, SlicePipe } from '@angular/common';
import { FileService } from '../services/file-service';

@Component({
  selector: 'app-carrito-component',
  imports: [
    SeleccionUbicaciones,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatSelectModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    FormsModule,
    CurrencyPipe,
    SlicePipe,
  ],
  templateUrl: './carrito-component.html',
  styleUrl: './carrito-component.scss',
})
export class CarritoComponent implements OnInit, OnDestroy {
  private carroService = inject(CarroService);
  private pedidoService = inject(PedidoService);
  private authService = inject(AuthService);
  private sucursalService = inject(SucursalService);
  private formaPagoService = inject(FormaPagoService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  fileService = inject(FileService);

  items = signal<CartItem[]>([]);
  totalItems = signal(0);
  totalPrice = signal(0);
  isLoading = signal(false);
  ubicacionEntrega = signal<{ lat: number; lng: number; direccion: string } | null>(null);
  sucursalActual = signal<Sucursal | null>(null);
  formasPago = signal<FormaPago[]>([]);
  formaPagoSeleccionada = signal<number | null>(null);

  private subscription = new Subscription();

  ngOnInit() {
    this.subscription.add(
      this.carroService.watchItems().subscribe((cartItems) => {
        this.items.set(cartItems.map((i) => ({ ...i, producto: { ...i.producto } })));
        this.totalItems.set(this.carroService.getTotalItems());
        this.totalPrice.set(this.carroService.getTotalPrice());
        if (cartItems.length > 0) {
          this.sucursalActual.set(cartItems[0].producto.sucursal!);
        }
      }),
    );

    this.formaPagoService.findAll().subscribe((fp) => this.formasPago.set(fp));
    this.refreshCart();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  private refreshCart() {
    const current = this.carroService.getItems();
    this.items.set(current.map((i) => ({ ...i, producto: { ...i.producto } })));
    this.totalItems.set(this.carroService.getTotalItems());
    this.totalPrice.set(this.carroService.getTotalPrice());
  }

  onUbicacionSeleccionada(event: { lat: number; lng: number; direccion: string }) {
    this.ubicacionEntrega.set(event);
  }

  volverALaTienda() {
    this.router.navigate(['/home']);
  }

  aumentarCantidad(item: CartItem) {
    this.carroService.addProduct(item.producto, 1);
  }

  disminuirCantidad(item: CartItem) {
    if (item.cantidad <= 1) {
      this.eliminarProducto(item);
    } else {
      this.carroService.addProduct(item.producto, -1);
    }
  }

  eliminarProducto(item: CartItem) {
    this.carroService.removeProduct(item.producto.id!);
  }

  vaciarCarrito() {
    this.carroService.clear();
  }

  confirmarPedido() {
    if (!this.ubicacionEntrega()) {
      this.snackBar.open('Seleccioná una ubicación de entrega antes de confirmar.', 'OK', { duration: 4000 });
      return;
    }

    if (!this.formaPagoSeleccionada()) {
      this.snackBar.open('Elegí una forma de pago antes de confirmar.', 'OK', { duration: 4000 });
      return;
    }

    const itemsActuales = this.carroService.getItems();
    if (itemsActuales.length === 0) {
      this.snackBar.open('Tu carrito está vacío.', 'OK', { duration: 3000 });
      return;
    }

    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      this.snackBar.open('Debés iniciar sesión para confirmar tu pedido.', 'Iniciar sesión', { duration: 5000 })
        .onAction()
        .subscribe(() => this.router.navigate(['/login']));
      return;
    }

    const sucursal = this.sucursalActual();
    this.isLoading.set(true);

    const pagoData = {
      numero: `PAG-${Date.now()}`,
      monto: this.totalPrice(),
      formaPagoId: this.formaPagoSeleccionada()!,
    };

    this.pedidoService
      .crearPago(pagoData)
      .pipe(
        switchMap((pago) => {
          const pedidoData = {
            numero: `PED-${Date.now()}`,
            horaLlegadaEstimada: new Date(Date.now() + 45 * 60000).toISOString(),
            montoTotal: this.totalPrice(),
            tiempoPreparacionEstimado: 30,
            tiempoRepartoEstimado: 20,
            fechaHora: new Date().toISOString(),

            empresaId: sucursal?.empresa?.usuarioId ?? 1,
            compradorId: userId,
            pagoId: pago.id,

            infoRuta: {
              origen: {
                coordenadas: {
                  lat: sucursal?.coordenadaX ?? -32.69,
                  lng: sucursal?.coordenadaY ?? -63.29,
                },
                calle: sucursal?.nombre ?? '',
              },
              destino: {
                coordenadas: {
                  lat: this.ubicacionEntrega()!.lat,
                  lng: this.ubicacionEntrega()!.lng,
                },
                calle: this.ubicacionEntrega()!.direccion,
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
        next: (pedidoCreado) => {
          this.carroService.clear();
          this.snackBar.open('¡Pedido confirmado con éxito!', 'Ver seguimiento', { duration: 6000 })
            .onAction()
            .subscribe(() => this.router.navigate(['/seguimiento', pedidoCreado.id]));
          this.router.navigate(['/seguimiento', pedidoCreado.id]);
        },
        error: (err) => {
          console.error('Error al confirmar el pedido:', err);
          this.snackBar.open('Error al confirmar el pedido. Intentá nuevamente.', 'OK', { duration: 5000 });
          this.isLoading.set(false);
        },
      });
  }
}
