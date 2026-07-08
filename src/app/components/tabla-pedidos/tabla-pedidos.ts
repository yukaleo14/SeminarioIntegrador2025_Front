import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { SocketService } from '../../services/socket.service';
import { Pedido, PedidoService } from './../../services/pedido-service';
import { Subscription } from 'rxjs/internal/Subscription';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth-service';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectChange } from '@angular/material/select';

const ESTADOS_PEDIDO = [
  'CREADO',
  'ENPREPARACION',
  'PUBLICADO',
  'ASIGNADO',
  'ENRUTA',
  'ENTREGADO',
  'CANCELADO',
  'DEMORADO'
];

const TRANSICIONES_PERMITIDAS: Record<string, string[]> = {
  'CREADO': ['ENPREPARACION', 'CANCELADO'],
  'ENPREPARACION': ['PUBLICADO'],
  'PUBLICADO': ['ASIGNADO'],
  'ASIGNADO': ['ENRUTA', 'CANCELADO'],
  'ENRUTA': ['ENTREGADO', 'DEMORADO'],
  'DEMORADO': ['ENTREGADO', 'CANCELADO'],
  'ENTREGADO': [], // Estado final
  'CANCELADO': []  // Estado final
};

@Component({
  selector: 'app-tabla-pedidos',
  standalone: true,
  imports: [
    NgClass,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatChipsModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './tabla-pedidos.html',
  styleUrl: './tabla-pedidos.scss'
})
export class TablaPedidos implements OnInit, OnDestroy {

  pedidos = signal<Pedido[]>([]);
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
      this.pedidos.set(this.ordenarPedidos(pedidosIniciales));
      this.isLoading = false;
    });

    // Escuchar nuevos pedidos en tiempo real
    this.subscriptions.add(
      this.socketService.onNuevoPedido().subscribe((nuevoPedido: Pedido) => {
        console.log('Nuevo pedido recibido:', nuevoPedido.numero);
        this.pedidos.update(current => this.ordenarPedidos([...current, nuevoPedido]));
      })
    );

    // Escuchar cambios de estado en tiempo real
    this.subscriptions.add(
      this.socketService.onPedidoActualizado().subscribe((pedidoActualizado: Pedido) => {
        console.log('Pedido actualizado:', pedidoActualizado.numero, '→', pedidoActualizado.estado?.nombre);
        this.actualizarPedidoEnLista(pedidoActualizado);
      })
    );
  }

  cambiarEstado(pedido: Pedido, event: MatSelectChange) {
    const nuevoEstado = event.value;
    const estadoActual = pedido.estado?.nombre?.toUpperCase() || '';
    const estadoDestino = nuevoEstado?.toUpperCase() || '';

    if (!nuevoEstado || estadoActual === estadoDestino) return;

    // Obtener las transiciones permitidas para el estado actual
    const transicionesPosibles = TRANSICIONES_PERMITIDAS[estadoActual] || [];

    // Validar si el nuevo estado está permitido
    if (!transicionesPosibles.includes(estadoDestino)) {
      alert(`⚠️ Acción no permitida.\n\nUn pedido en estado "${estadoActual}" no puede pasar directamente a "${estadoDestino}".`);
      
      // Revertir visualmente la selección en el mat-select al estado original
      event.source.value = pedido.estado?.nombre;
      return;
    }

    // Si es válido, procedemos con la actualización
    this.pedidoService.actualizarEstado(pedido.id, nuevoEstado).subscribe({
      next: (pedidoActualizado) => {
        console.log(`Pedido ${pedido.numero} actualizado a estado ${nuevoEstado}`);
      },
      error: (err) => {
        console.error('Error al actualizar estado del pedido:', err);
        alert('Error al actualizar el estado del pedido. Por favor, intenta nuevamente.');
        // Revertir en caso de error del servidor
        event.source.value = pedido.estado?.nombre;
      }
    });
  }

  private actualizarPedidoEnLista(pedidoActualizado: Pedido) {
    this.pedidos.update(current =>
      current.map(p => p.id === pedidoActualizado.id ? { ...p, estado: pedidoActualizado.estado } : p)
    );
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
    if (!estadoNombre) return 'estado-chip estado-default';
    const estado = estadoNombre.toUpperCase().trim();
    switch (estado) {
      case 'PAGADO':         return 'estado-chip estado-pagado';
      case 'ENPREPARACION':
      case 'EN PREPARACION': return 'estado-chip estado-preparacion';
      case 'ASIGNADO':       return 'estado-chip estado-asignado';
      case 'ENRUTA':
      case 'EN RUTA':        return 'estado-chip estado-ruta';
      case 'ENTREGADO':      return 'estado-chip estado-entregado';
      case 'CANCELADO':
      case 'DEMORADO':       return 'estado-chip estado-danger';
      case 'PENDIENTE':      return 'estado-chip estado-default';
      default:               return 'estado-chip estado-default';
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