import {
  Component, OnInit, OnDestroy, ElementRef, ViewChild,
  AfterViewChecked, inject, signal, Input, Output, EventEmitter,
} from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { MatFormField, MatInput } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ChatService } from '../../services/chat-service';
import { AuthService, Payload, User } from '../../services/auth-service';
import { Subscription } from 'rxjs';

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
    NgClass,
    MatFormField,
    FormsModule,
    MatButton,
    MatIconButton,
    MatInput,
    MatIconModule,
    DatePipe,
  ],
  styleUrl: './chat.scss',
})
export class Chat implements AfterViewChecked, OnInit, OnDestroy {
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;
  @Input() pedidoId!: number;
  @Output() cerrar = new EventEmitter<void>();

  private readonly chatService = inject(ChatService);
  private readonly authService = inject(AuthService);

  private user!: User;
  messages = signal<Message[]>([]);
  newMessage: string = '';
  users = signal<Payload[]>([]);
  otherUser = signal<Payload | null>(null);
  mostrarMsj = signal<boolean>(false);

  abierto = signal(true);

  private refreshInterval: any;
  private subs: Subscription[] = [];

  ngOnInit() {
    const token = this.authService.getToken();
    this.user = this.authService.getCurrentUser() || this.authService.getObjetoUser();

    console.log('[Chat] ngOnInit - pedidoId:', this.pedidoId, 'token:', token ? 'presente' : 'FALTA');

    this.authService.getCurrentUserProfile().subscribe({
      next: (user: User) => {
        this.user = user;
        this.mostrarMsj.set(true);
      },
      error: () => {
        this.mostrarMsj.set(true);
      },
    });

    if (!token) {
      console.error('[Chat] No hay token, no se puede conectar al chat');
      return;
    }
    if (!this.pedidoId) {
      console.error('[Chat] No hay pedidoId, no se puede conectar al chat');
      return;
    }

    this.conectar(token);
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    this.subs.forEach(s => s.unsubscribe());
    this.subs = [];
  }

  toggleChat() {
    this.abierto.update(v => !v);
  }

  cerrarChat() {
    this.abierto.set(false);
    this.cerrar.emit();
  }

  private async conectar(token: string) {
    this.subs.push(
      this.chatService.onUsersInRoom().subscribe((users) => {
        const unique = this.removeDuplicates(users);
        this.users.set(unique);
        this.otherUser.set(unique.find(u => u.id !== this.user.id) || null);
      })
    );

    this.subs.push(
      this.chatService.onMessage().subscribe((data: any) => {
        this.messages.update(prev => [
          ...prev,
          {
            userId: data.sender.id,
            text: data.message,
            timestamp: new Date(data.timestamp),
            senderName: data.sender.nombre,
          },
        ]);
      })
    );

    this.subs.push(
      this.chatService.onError().subscribe((errorData) => {
        console.error('[Chat] Error del backend:', errorData.message);
      })
    );

    this.subs.push(
      this.chatService.onHistorial().subscribe((historial: any[]) => {
        const msgs: Message[] = historial.map((m: any) => ({
          userId: m.remitente?.id ?? m.remitenteId,
          text: m.contenido,
          timestamp: new Date(m.timestamp),
          senderName: m.remitente?.mail,
        }));
        this.messages.set(msgs);
      })
    );

    try {
      await this.chatService.connect(token);
      console.log('[Chat] Conectado! uniéndose a sala pedido-' + this.pedidoId);
      this.chatService.joinRoom(this.pedidoId);
      this.startPeriodicRefresh();
    } catch (err) {
      console.error('[Chat] No se pudo conectar:', err);
    }
  }

  private startPeriodicRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    this.refreshInterval = setInterval(() => {
      this.chatService.joinRoom(this.pedidoId);
    }, 3000);
  }

  private removeDuplicates(users: any[]) {
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
      if (this.scrollContainer?.nativeElement) {
        this.scrollContainer.nativeElement.scrollTop =
          this.scrollContainer.nativeElement.scrollHeight;
      }
    } catch (err) {}
  }
}
