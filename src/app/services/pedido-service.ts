import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../environments/environment';
import { AuthService } from './auth-service';
import { Rol } from '../models/Rol';   // Asegúrate que la ruta sea correcta

export interface Pedido {
  id: number;
  numero: string;
  montoTotal: number;
  fechaHora: Date;
  horaLlegadaEstimada?: Date;
  tiempoPreparacionEstimado?: number;
  tiempoRepartoEstimado?: number;
  estadoId: number;
  rutaId?: number;
  ruta: {
    id: number;
    tarifaDistancia?: number;
    origen: {
      calle?: string;
      altura?: string;
      nombre?: string;
      posicion: { coordenadaX: number; coordenadaY: number };
    };
    destino: {
      calle?: string;
      altura?: string;
      nombre?: string;
      posicion: { coordenadaX: number; coordenadaY: number };
    };
  };
  pagoId?: number;

  comprador?: { id: number; nombre: string };
  empresa?: { id: number; nombre: string };
  repartidor?: { id: number; nombre: string };
  estado?: { id: number; nombre: string };

  detalle: {
    productoId: number;
    cantidad: number;
    montoSubtotal: number;
    }[];


}

@Injectable({
  providedIn: 'root'
})
export class PedidoService {
  private socket: Socket;
  private pedidosSubject = new BehaviorSubject<Pedido[]>([]);
  public pedidos$ = this.pedidosSubject.asObservable();

  private apiUrl = `${environment.apiUrl}/pedidos`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.socket = io(`${environment.apiUrl}/pedidos`, {
      transports: ['websocket'],
      autoConnect: false
    });

    this.setupSocketListeners();
  }

  crearPedido(pedido: any): Observable<Pedido> {
    return this.http.post<Pedido>(`${this.apiUrl}`, pedido);
  }

  crearPago(data: { numero: string; monto: number; formaPagoId?: number }): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(`${environment.apiUrl}/pago`, {
      ...data,
      fechaHora: new Date().toISOString(),
    });
  }
  
  findOne(pedidoId: number): Observable<Pedido> {
    return this.http.get<Pedido>(`${this.apiUrl}/${pedidoId}`);
  }


  // ==================== HTTP ====================

  getPedidosDeMiEmpresa(): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(`${this.apiUrl}/empresa/me`);
  }

  // ==================== WebSocket ====================

  actualizarEstado(pedidoId: number, estado: string) {
    return this.http.patch<any>(`${this.apiUrl}/${pedidoId}/estado`, { estado });
  }

  cancelarPedido(pedidoId: number): Observable<Pedido> {
    return this.http.patch<Pedido>(`${this.apiUrl}/${pedidoId}/cancelar`, {});
  }

  findDisponibles(): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(`${this.apiUrl}/disponibles`);
  }

  findMisPedidos(): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(`${this.apiUrl}/repartidor/me`);
  }

  tomarPedido(pedidoId: number): Observable<Pedido> {
    return this.http.patch<Pedido>(`${this.apiUrl}/${pedidoId}/tomar`, {});
  }

  connectAndJoinRoom(): void {
    if (!this.authService.isAuthenticated() || !this.authService.isEmpresa()) {
      console.warn('Usuario no autenticado o no es empresa');
      return;
    }

    const empresaId = this.authService.getEmpresaId();

    if (!empresaId) {
      console.error('No se pudo obtener el ID de la empresa');
      return;
    }

    this.socket.connect();
    this.socket.emit('joinCompanyRoom', empresaId.toString());
  }

  private setupSocketListeners(): void {
    this.socket.on('newPedido', (nuevoPedido: Pedido) => {
      console.log('Nuevo pedido recibido en tiempo real:', nuevoPedido);
      const currentPedidos = this.pedidosSubject.value;
      this.pedidosSubject.next([nuevoPedido, ...currentPedidos]);
    });

    this.socket.on('joinedRoom', (data: any) => {
      console.log('Conectado correctamente a la sala de la empresa', data);
    });

    this.socket.on('connect_error', (err: any) => {
      console.error('Error conectando al WebSocket:', err);
    });
  }

  setPedidos(pedidos: Pedido[]): void {
    this.pedidosSubject.next(pedidos);
  }

  disconnect(): void {
    if (this.socket.connected) {
      this.socket.disconnect();
    }
  }
}