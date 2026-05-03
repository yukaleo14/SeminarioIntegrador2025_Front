import { Component, OnInit, ElementRef, ViewChild, AfterViewChecked, inject, signal } from '@angular/core';
import { MatCard, MatCardActions, MatCardHeader, MatCardSubtitle, MatCardTitle } from '@angular/material/card';
import { DatePipe, NgClass } from '@angular/common';
import { MatFormField, MatInput } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { ChatService } from '../../services/chat-service';
import { AuthService, Payload, User } from '../../services/auth-service';
import { Router } from '@angular/router';

interface Message {
  userId: number;
  text: string;
  timestamp: Date;
  senderName?: string;
}

@Component({
  selector: 'app-chat',
  templateUrl: './chat.html',
  imports: [
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardSubtitle,
    NgClass,
    MatCardActions,
    MatFormField,
    FormsModule,
    MatButton,
    MatInput,
    DatePipe
  ],
  styleUrl: './chat.scss'
})

export class Chat implements AfterViewChecked, OnInit {
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  private readonly chatService = inject(ChatService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  private token: string | null = '';
  private user!: User;


  messages = signal<Message[]>([]);
  newMessage: string = '';
  users = signal<Payload[]>([]);
  otherUser = signal<Payload | null>(null);

  mostrarMsj = signal<boolean>(false);

  pedidoId: number = 1;
  private storageKey = `chat-messages-pedido-${this.pedidoId}`;

  ngOnInit() {
    this.user = this.authService.getObjetoUser();
    this.token = this.authService.getToken();
    this.authService.getCurrentUserProfile()
      .subscribe((user: User) => {
        this.user = user;
        this.mostrarMsj.set(true);
        console.log(this.user);
      });
    if (this.token !== null) {
      // 1. conectar con token
      this.chatService.connect(this.token);
      // 2. unirse a la sala Modificar 1 por el id del pedido generado
      // Solo se unen al chat dependiendo el pedido id, el back verifica que el usuario tenga acceso a ese pedido
      // sea repartidor o comprador, si es empresa no puede unirse a ningún chat
      this.chatService.joinRoom(this.pedidoId);

      this.loadMessagesFromStorage();

      // Escuchar el evento 'error'
      this.chatService.onError()
        .subscribe((errorData) => {
          console.log('Error recibido:', errorData.message);  // Muestra: "Invalid or expired token"
          // Aquí puedes mostrar un mensaje al usuario, redirigir al login, etc.
          alert('Error de autenticación: ' + errorData.message);
          this.router.navigate(['/home']).then();
        }
        );

      // Obtener los usuarios de la sala
      this.chatService.onUsersInRoom((users) => {
        // 🔥 opcional: evitar duplicados por múltiples tabs
        const unique = this.removeDuplicates(users);
        this.users.set(unique);
        this.otherUser.set(
          unique.find(u => u.id !== this.user.id) || null
        );
        console.log('Usuarios en sala: ', this.users);
      });

      // 3. escuchar mensajes
      this.chatService.onMessage().subscribe((data: any) => {
        this.messages.update(prev => {
          const next = [
            ...prev,
            {
              userId: data.sender.id,
              text: data.message,
              timestamp: new Date(data.timestamp),
              senderName: data.sender.nombre
            }
          ];
          this.saveMessagesToStorage(next);
          return next;
        });
      });
    }
  }

  removeDuplicates(users: any[]) {
    const map = new Map();
    users.forEach(u => map.set(u.id, u));
    return Array.from(map.values());
  }

  sendMessage(): void {
    if (!this.newMessage.trim()) return;
    this.chatService.sendMessage(this.pedidoId, this.newMessage);
    this.newMessage = '';
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  isCurrentUser(message: Message): boolean {
    return message.userId === this.user.id;
  }

  private scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop =
        this.scrollContainer.nativeElement.scrollHeight;
    } catch (err) {
    }
  }

  private loadMessagesFromStorage() {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      try {
        this.messages.set(JSON.parse(saved));
      } catch (error) {
        console.error('Error parseando mensajes guardados', error);
      }
    }
  }

  private saveMessagesToStorage(messages: Message[]) {
    localStorage.setItem(this.storageKey, JSON.stringify(messages));
  }
}
