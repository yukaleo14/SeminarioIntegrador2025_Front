import { Component, computed, inject, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink } from '@angular/router';
import { ConfirmarPedidoLauncher } from '../../services/confirmar-pedido-launcher';
import { AuthService, User } from '../../services/auth-service';
import { CarroService } from '../../services/carro-service';
import { MatBadge } from '@angular/material/badge';

@Component({
  selector: 'app-header',
  imports: [MatToolbarModule, MatButtonModule, MatBadge, MatIconModule, MatMenuModule, RouterLink, NgOptimizedImage],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header {
  private readonly _usersService = inject(AuthService);
  private carroService = inject(CarroService);
  private pedidoLauncher = inject(ConfirmarPedidoLauncher);

  totalItems = computed(() => this.carroService.getTotalItems());

  isLoggedIn = signal(false);
  constructor() {
    this._usersService.getCurrentUserProfile().pipe(
      takeUntilDestroyed()
    ).subscribe({
      next: (user: User) => {
        this.isLoggedIn.set(user != null);
      }
    });
  }

  logout() {
    this._usersService.logout();
    this.isLoggedIn.set(false);
  }

  irAlCarrito() {
    const sucursal = this.carroService.getItems()[0]?.producto.sucursal;
    if (!sucursal) return;
    this.pedidoLauncher.abrir(sucursal);
  }
}
