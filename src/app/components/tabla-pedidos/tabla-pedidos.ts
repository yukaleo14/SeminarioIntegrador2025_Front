import { Component, OnInit, OnDestroy, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocketService } from '../../services/socket.service'; // ← tu servicio de socket
import { Pedido, PedidoService } from './../../services/pedido-service'; // ← tu interface/modelo
import { Subscription } from 'rxjs/internal/Subscription';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth-service';
import { FormsModule } from '@angular/forms';

const ESTADOS_PEDIDO = [
  'CREADO',
  'ENPREPARACION',
  'TOMADO',
  'ENRUTA',
  'ENTREGADO',
  'CANCELADO',
  'DEMORADO',
  'PENDIENTE'
];

@Component({
  selector: 'app-tabla-pedidos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tabla-pedidos.html',
  styleUrl: './tabla-pedidos.scss'
})
export class TablaPedidos implements OnInit, OnDestroy {

  pedidos: Pedido[] = [];
  empresaId: number | null = null;
  isLoading: boolean = true;
  estadosDisponibles = ESTADOS_PEDIDO;

  private subscriptions = new Subscription();

    constructor(
    private socketService: SocketService,
    private authService: AuthService,
    private pedidoService: PedidoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('TablaPedidosComponent inicializado');

    this.empresaId = this.authService.getEmpresaId();
    if (!this.empresaId) {
      console.error('No se pudo obtener el ID de la empresa, redirigiendo a home...');
      this.router.navigate(['/home']);
      return;
    }

    console.log('ID de la empresa obtenida:', this.empresaId);
    
    this.socketService.connect();
    
    setTimeout(() => {
      this.socketService.joinCompanyRoom(this.empresaId!);
    }, 600);
    
    // Recibir lista inicial de pedidos
    this.socketService.onPedidosList((pedidosIniciales: Pedido[]) => {
      console.log('Pedidos iniciales recibidos:', pedidosIniciales.length);
      this.pedidos = this.ordenarPedidos(pedidosIniciales);
      this.isLoading = false;
    });

    // Escuchar nuevos pedidos en tiempo real
    this.subscriptions.add(
      this.socketService.onNuevoPedido().subscribe((nuevoPedido: Pedido) => {
        console.log('Nuevo pedido recibido:', nuevoPedido.numero);
        this.pedidos = this.ordenarPedidos([...this.pedidos, nuevoPedido]);
      })
    );
  }

  cambiarEstado(pedido: Pedido, nuevoEstado: string) {
      if (!nuevoEstado || pedido.estado?.nombre === nuevoEstado) return;

      this.pedidoService.actualizarEstado(pedido.id, nuevoEstado).subscribe({
        next: (pedidoActualizado) => {
          console.log(`Pedido ${pedido.numero} actualizado a estado ${nuevoEstado}`);
        },
        error: (err) => {
          console.error('Error al actualizar estado del pedido:', err);
          alert('Error al actualizar el estado del pedido. Por favor, intenta nuevamente.');
        }
      });
  }

  private actualizarPedidoEnLista(pedidoActualizado: Pedido) {
    this.pedidos = this.pedidos.map(p =>
      p.id === pedidoActualizado.id ? { ...p, estado: pedidoActualizado.estado } : p
    )
  }

  // Ordenar pedidos: primero por horaLlegadaEstimada (más cercano primero)
  private ordenarPedidos(pedidos: Pedido[]): Pedido[] {
    return [...pedidos].sort((a, b) => {
      const fechaA = a.horaLlegadaEstimada ? new Date(a.horaLlegadaEstimada).getTime() : 0;
      const fechaB = b.horaLlegadaEstimada ? new Date(b.horaLlegadaEstimada).getTime() : 0;
      return fechaA - fechaB; // más pronto primero
    });
  }

  trackById(index: number, pedido: Pedido): number {
    return pedido.id;
  }

  goToHome() {
    this.router.navigate(['/home']);
  }


  getEstadoClass(estadoNombre?: string): string {
  if (!estadoNombre) return 'bg-secondary';

  const estado = estadoNombre.toUpperCase().trim();

  switch (estado) {
    case 'CREADO':
      return 'bg-primary';
    case 'ENPREPARACION':
    case 'EN PREPARACION':
      return 'bg-warning text-dark';
    case 'TOMADO':
      return 'bg-info';
    case 'ENRUTA':
    case 'EN RUTA':
      return 'bg-orange';
    case 'ENTREGADO':
      return 'bg-success';
    case 'CANCELADO':
      return 'bg-danger';
    case 'DEMORADO':
      return 'bg-danger';
    case 'PENDIENTE':
      return 'bg-secondary';
    default:
      return 'bg-secondary';
  }
}

  verDetalle(pedido: Pedido) {
    console.log('Ver detalle del pedido:', pedido);
  // Aquí puedes abrir un modal o navegar a otra página
  // this.router.navigate(['/pedidos', pedido.id]);
  }


  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    // this.socketService.disconnect(); // Descomenta si quieres desconectar al salir
  }

  // Opcional: formatear hora para mostrar bonito
  formatHora(fecha: Date | string): string {
    return new Date(fecha).toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}