import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { CarroService, CartItem } from '../services/carro-service';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth-service';
import { PedidoService } from '../services/pedido-service';
import { Subscription } from 'rxjs';
import { SeleccionUbicaciones } from './../components/seleccion-ubicaciones/seleccion-ubicaciones';

@Component({
  selector: 'app-carrito-component',
  imports: [CommonModule, SeleccionUbicaciones],
  templateUrl: './carrito-component.html',
  styleUrl: './carrito-component.scss'
})
export class CarritoComponent implements OnInit {

private carroService = inject(CarroService);
  private pedidoService = inject(PedidoService);
  private authService = inject(AuthService);
  private router = inject(Router);

  items = signal<CartItem[]>([]);
  totalItems = signal(0);
  totalPrice = signal(0);
  isLoading = signal(false);
  ubicacionEntrega = signal<{ lat: number, lng: number, direccion: string } | null>(null);
  sucursalActual: any = null; 

  private subscription = new Subscription();

  ngOnInit() {
    this.subscription.add(
      this.carroService.watchItems().subscribe(cartItems => {
        console.log('🛒 Carrito actualizado - items con sus IDs:', 
    cartItems.map(i => ({
      id: i.producto.id,
      nombre: i.producto.nombre,
      cantidad: i.cantidad
    })));
        const newItems = cartItems.map(item => ({
        ...item,
        producto: { ...item.producto }   // copia profunda del producto
      }));

      this.items.set(newItems);
      console.log('Items en carrito (desde subscribe):', this.items());
      console.log('Cantidad de items:', this.items().length);
        this.totalItems.set(this.carroService.getTotalItems());
        this.totalPrice.set(this.carroService.getTotalPrice());

        if (cartItems.length > 0) {
          this.sucursalActual = cartItems[0].producto.sucursal;
        }
      })
    );

    this.refreshCart();
  }

  

  private refreshCart() {
    const currentItems = this.carroService.getItems();
    const newItems = currentItems.map(item => ({
        ...item,
        producto: { ...item.producto }   // copia profunda del producto
      }));

      this.items.set(newItems);
    this.totalItems.set(this.carroService.getTotalItems());
    this.totalPrice.set(this.carroService.getTotalPrice());
  }

  trackByProducto(index: number, item: CartItem): number {
    return item.producto.id;   // o item.producto.id + '-' + item.cantidad si quieres
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  onUbicacionSeleccionada(event: any ) {
    const ubicacion = event as { lat: number, lng: number, direccion: string };
    this.ubicacionEntrega.set(ubicacion);
    console.log('Ubicación seleccionada:', event);
  }

  volverALaTienda() {
    this.router.navigate(['/home']);
  }

  cambiarCantidad(item: CartItem, event: Event) {
    const input = event?.target as HTMLInputElement;
    let nuevaCantidad = parseInt(input.value, 10);
    if (isNaN(nuevaCantidad) || nuevaCantidad < 1) {
      nuevaCantidad = 1;
      input.value = '1';
    }
    this.carroService.updateQuantity(item.producto.id, nuevaCantidad);
  }

  aumentarCantidad(item: CartItem) {
    this.carroService.addProduct(item.producto, 1);
  }

  disminuirCantidad(item: CartItem) {
    this.carroService.addProduct(item.producto, -1);
  }

  eliminarProducto(item: CartItem) {
    this.carroService.removeProduct(item.producto.id);
  }
  
  vaciarCarrito() {
    if (confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
      this.carroService.clear();
    }
  }


  confirmarPedido() {
    if (!this.ubicacionEntrega()) {
      alert('Por favor, selecciona una ubicación de entrega antes de confirmar tu pedido.');
      return;
    }

    const itemsActuales = this.carroService.getItems();
    if (itemsActuales.length === 0) {
      alert('El carrito está vacío');
      return;
    }

    const user = this.authService.getCurrentUser();
    if (!user) {
      alert('Debes iniciar sesión para confirmar tu pedido');
      this.router.navigate(['/login']);
      return;
    }

    this.isLoading.set(true);

    const pedidoData = {
      numero: `PED-${Date.now()}`,
      horaLlegadaEstimada: new Date(Date.now() + 45 * 60000).toISOString(), // 45 minutos después
      montoTotal: this.totalPrice(),           // ← importante
      tiempoPreparacionEstimado: 30, //mejorar
      tiempoRepartoEstimado: 20, //mejorar
      empresaId: itemsActuales[0]?.producto.sucursal || 1, // toma de primer producto
      compradorId: user.id,
      rutaId: 1, //mejorar
      repartidorId: 1, //mejorar
      pagoId: 1,   //mejorar
      estadoId: 1, // CREADO

      ubicacionEntregaLat: this.ubicacionEntrega()!.lat,
      ubicacionEntregaLng: this.ubicacionEntrega()!.lng,
      direccionEntrega: this.ubicacionEntrega()!.direccion,
      // detallePedidos: itemsActuales.map(i => ({
      //   productoId: i.producto.id,
      //   cantidad: i.cantidad,
      //   precioUnitario: i.producto.precio
      // }))
    };

    this.pedidoService.crearPedido(pedidoData).subscribe({
      next: (pedidoCreado) => {
        alert('Pedido confirmado con éxito!');
        this.carroService.clear();
        this.router.navigate(['/seguimiento', pedidoCreado.id]);
      },
      error: (err) => {
        console.error('Error al confirmar el pedido:', err);
        alert('Error al confirmar el pedido. Por favor, intenta nuevamente.');
        this.isLoading.set(false);
      }
    });
  }



}
