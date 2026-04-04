import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { Pedido } from './pedido-service';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket: Socket;
  private ordersSubject = new BehaviorSubject<any[]>([]);

  constructor() {
    this.socket = io(environment.apiUrl + '/orders', {
      transports: ['websocket'],
    });
  }
  
  connect() {
    if (!this.socket.connected) {
      this.socket = io('http://localhost:3000');
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
    console.log('Uniéndose a la sala de la empresa con ID:', sucursalId);
    this.socket.emit('joinCompanyRoom', sucursalId);
  }                     

  // Escuchar nuevos pedidos
  onNewPedido(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('Nuevo pedido', (order: any) => {
        console.log('Nuevo pedido recibido:', order);
        observer.next(order);
      });
    });
  }

  // Obtener la lista reactiva para la tabla
  getPedidos$(): Observable<any[]> {
    return this.ordersSubject.asObservable();
  }

  updatePedidos(pedidos: Pedido[]) {
    this.ordersSubject.next(pedidos);
  }

  onPedidoCreado(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('pedidoCreado', (pedido) => {
        observer.next(pedido);
      });
    });
  }


  // Agregar pedido a la lista local (para que se actualice la tabla)
  addPedido(order: any) {
    const current = this.ordersSubject.value;
    this.ordersSubject.next([...current, order]);
  }

  disconnect() {
    this.socket.disconnect();
  }
}