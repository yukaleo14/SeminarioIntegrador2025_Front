import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterLink } from '@angular/router';
import { AuthService, User } from '../../services/auth-service';
import { CarroService } from '../../services/carro-service';
@Component({
  selector: 'app-header',
  imports: [MatToolbarModule, MatButtonModule, MatIconModule, MatMenuModule, RouterLink, MatMenuModule],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header {
  private readonly _usersService = inject(AuthService);
  private router = inject(Router);
  private carroService = inject(CarroService);

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
    this._usersService.logout()
    this.isLoggedIn.set(false);
  }

  irAlCarrito() {
    this.router.navigate(['/carrito']);
  }
}
