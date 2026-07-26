import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private socket!: Socket;
  private message$ = new Subject<any>();
  private usersInRoom$ = new Subject<any[]>();
  private error$ = new Subject<any>();
  private historial$ = new Subject<any[]>();
  private connectionPromise: Promise<void> | null = null;

  connect(token: string): Promise<void> {
    if (this.socket?.connected) {
      console.log('[ChatService] Ya conectado, id:', this.socket.id);
      return Promise.resolve();
    }

    if (this.connectionPromise) {
      console.log('[ChatService] Ya intentando conectar, reusando promise');
      return this.connectionPromise;
    }

    if (this.socket) {
      console.log('[ChatService] Socket viejo existe, limpiando...');
      this.socket.removeAllListeners();
      this.socket.disconnect();
    }

    console.log('[ChatService] Creando socket a http://localhost:3000');
    this.socket = io('http://localhost:3000', {
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
    });

    this.connectionPromise = new Promise<void>((resolve, reject) => {
      const onConnect = () => {
        console.log('[ChatService] ✅ Socket CONECTADO, id:', this.socket.id);
        cleanup();
        resolve();
      };

      const onConnectError = (err: any) => {
        console.error('[ChatService] ❌ Error de conexión:', err.message);
        cleanup();
        reject(err);
      };

      const cleanup = () => {
        this.socket.off('connect', onConnect);
        this.socket.off('connect_error', onConnectError);
        this.connectionPromise = null;
      };

      this.socket.on('connect', onConnect);
      this.socket.on('connect_error', onConnectError);
    });

    this.socket.on('disconnect', (reason: any) => {
      console.warn('[ChatService] ⚠️ Socket DESCONECTADO:', reason);
    });

    this.socket.on('newMessage', (data: any) => {
      console.log('[ChatService] Mensaje recibido:', data);
      this.message$.next(data);
    });

    this.socket.on('usersInRoom', (users: any[]) => {
      console.log('[ChatService] Usuarios en sala:', users);
      this.usersInRoom$.next(users);
    });

    this.socket.on('chatHistorial', (historial: any[]) => {
      console.log('[ChatService] Historial:', historial.length, 'mensajes');
      this.historial$.next(historial);
    });

    this.socket.on('error', (data: any) => {
      console.error('[ChatService] Error del backend:', data);
      this.error$.next(data);
    });

    console.log('[ChatService] Llamando socket.connect()');
    this.socket.connect();

    return this.connectionPromise;
  }

  disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.connectionPromise = null;
    }
  }

  joinRoom(pedidoId: number) {
    const id = Number(pedidoId);
    if (!this.socket) {
      console.warn('[ChatService] No hay socket, no se puede unir a sala');
      return;
    }
    if (this.socket.connected) {
      console.log('[ChatService] Uniéndose a sala pedido-' + id);
      this.socket.emit('joinRoom', { pedidoId: id });
    } else {
      console.warn('[ChatService] Socket NO conectado, estado:', this.socket.connected);
    }
  }

  sendMessage(pedidoId: number, message: string) {
    if (this.socket?.connected) {
      this.socket.emit('sendMessage', { pedidoId: Number(pedidoId), message });
    }
  }

  onMessage() {
    return this.message$.asObservable();
  }

  onUsersInRoom() {
    return this.usersInRoom$.asObservable();
  }

  onError() {
    return this.error$.asObservable();
  }

  onHistorial() {
    return this.historial$.asObservable();
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}
