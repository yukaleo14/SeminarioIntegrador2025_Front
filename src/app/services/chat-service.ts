import {Injectable} from '@angular/core';
import {io, Socket} from 'socket.io-client';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private socket!: Socket;

  connect(token: string) {
    this.socket = io('http://localhost:3000', {
      auth: {
        token: token // 🔥 ESTO ES LO QUE TU BACK ESPERA
      }
    });
  }

  joinRoom(pedidoId: number) {
    this.socket.emit('joinRoom', {pedidoId});
  }

  sendMessage(pedidoId: number, message: string) {
    this.socket.emit('sendMessage', {pedidoId, message});
  }

  onUsersInRoom(callback: (users: any[]) => void) {
    this.socket.on('usersInRoom', callback);
  }


  onMessage(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('newMessage', (data) => {
        observer.next(data);
      });
    });
  }
}
