import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink } from '@angular/router';
import { Usuario } from '../../models/Usuario';
import { AuthService } from '../../services/auth-service';
@Component({
  selector: 'app-header',
  imports: [MatToolbarModule, MatButtonModule, MatIconModule, MatMenuModule, RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header {
  private readonly _usersService = inject(AuthService);
  isLoggedIn = signal(false);
  constructor() {
    this._usersService.getCurrentUserProfile().pipe(
      takeUntilDestroyed()
    ).subscribe({
      next: (user: Usuario) => {
        this.isLoggedIn.set(user != null);
      }
    });
  }

}
