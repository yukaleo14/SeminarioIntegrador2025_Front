import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { Pedido } from './pedido-service';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket!: Socket;
  private pedidosSubject = new BehaviorSubject<Pedido[]>([]);

  constructor() {
    this.initSocket();
  }

  private initSocket() {
    const url = `${environment.apiUrl}/pedidos`; // Asegúrate de que apiUrl esté definido en tu environment
    this.socket = io(url, {
      transports: ['websocket', 'polling'], // Forzar uso de WebSocket
      autoConnect: false, // No conectar automáticamente
      reconnection: true, // Habilitar reconexión automática
      reconnectionAttempts: 10, // Intentar reconectar indefinidamente
      reconnectionDelay: 1500, // Esperar 1 segundo antes de intentar reconectar
    });
  }
  
  connect() {
    if (!this.socket.connected) {
      console.log('Conectando al servidor de WebSocket...');
      this.socket.connect();
    }
  }
  
  emit(event: string, data: any) {
    this.socket.emit(event, data);
  }

  on(event: string, callback: (data: any) => void) {
    this.socket.on(event, callback);
  }

  removeListener(event: string, callback: (data: any) => void) {
    this.socket.off(event, callback);
  }

  // Conectar y unirse a la sala de la empresa
  joinCompanyRoom(sucursalId: string | number) {
    if (this.socket.connected) {
      console.log('Uniéndose a la sala de la empresa con ID:', sucursalId);
      this.socket.emit('joinCompanyRoom', sucursalId);
    } else {
      console.error('No se pudo conectar al servidor de WebSocket');
    }
  }        
  
  onPedidosList(callback: (pedidos: Pedido[]) => void) {
    this.socket.on('pedidosList', (pedidos) => {
      console.log('Lista inicial de pedidos recibida:', pedidos.length);
      this.pedidosSubject.next(pedidos);
      callback(pedidos);
    });
  }

  // Escuchar nuevos pedidos
  onNuevoPedido(): Observable<Pedido> {
    return new Observable((observer) => {
      this.socket.on('Nuevo pedido', (pedido: Pedido) => {
        console.log('Nuevo pedido recibido:', pedido);
        this.addPedido(pedido); 
        observer.next(pedido);
      });
      return () => {
        this.socket.off('Nuevo pedido');
      };
    });
  }

  onPedidoActualizado(): Observable<Pedido> {
    return new Observable((observer) => {
      this.socket.on('Pedido actualizado', (pedido: Pedido) => {
        this.updatePedidos(pedido);
        observer.next(pedido);
      });
      return () => {
        this.socket.off('Pedido actualizado');
      };
    });
  }


  // Obtener la lista reactiva para la tabla
  getPedidos$(): Observable<Pedido[]> {
    return this.pedidosSubject.asObservable();
  }

  onPedidoCreado(): Observable<Pedido> {
    return new Observable((observer) => {
      this.socket.on('pedidoCreado', (pedido: Pedido) => {
        observer.next(pedido);
      });
    });
  }

  private addPedido(pedido: Pedido) {
    const currentPedidos = this.pedidosSubject.value;
    this.pedidosSubject.next([pedido, ...currentPedidos]);
  }
  
  updatePedidos(pedidosActualizado: Pedido) {
    const actuales = this.pedidosSubject.value.map(p =>
      p.id === pedidosActualizado.id ? pedidosActualizado : p
    )
    this.pedidosSubject.next(actuales);
  }

  onPosicionActualizada(): Observable<{ lat: number; lng: number }> {
    return new Observable((observer) => {
      this.socket.on('posicionActualizada', (coordenadas: { lat: number; lng: number }) => {
        observer.next(coordenadas);
      });

      return () => {
        this.socket.off('posicionActualizada');
      };
    });
  }

  joinPedidoRoom(pedidoId: string | number) {
    if (this.socket.connected) {
      this.socket.emit('joinPedidoRoom', { pedidoId });
      console.log(`Uniéndose a la sala del pedido con ID: ${pedidoId}`);
    }
  }

  disconnect() {
    this.socket.removeAllListeners();
    this.socket.disconnect();
  }
}