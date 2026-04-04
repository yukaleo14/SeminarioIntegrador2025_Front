import { Component, OnInit, OnDestroy, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocketService } from '../../services/socket.service'; // ← tu servicio de socket
import { Pedido } from '../../models/Pedido'; // ← tu interface/modelo

@Component({
  selector: 'app-tabla-pedidos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tabla-pedidos.html',
  styleUrl: './tabla-pedidos.scss'
})
export class TablaPedidos implements OnInit, OnDestroy {

  private socketService = inject(SocketService);
  pedidos = signal<Pedido[]>([]);
  
  sucursalId: number = 1; // Cambia esto según tu lógica para obtener el ID de la sucursal
  private subscription1: any;
  private subscription2: any;     

  ngOnInit(): void {
    this.socketService.connect();
    this.socketService.joinCompanyRoom(this.sucursalId);

    this.subscription1 = this.socketService.getPedidos$().subscribe((pedidos) => {
      console.log('Pedidos recibidos:', pedidos);
      this.pedidos.set(pedidos);
    });
    this.subscription2 = this.socketService.onNewPedido().subscribe((newPedido) => {
      console.log('Nuevo pedido recibido:', newPedido);
      const current = this.pedidos();
      this.pedidos.set([...current, newPedido]);
    });
  }

  ngOnDestroy(): void {
    this.subscription1.unsubscribe();
    this.subscription2.unsubscribe();
    this.socketService.disconnect();
  }
}
