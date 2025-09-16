import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
@Component({
  selector: 'app-header',
  imports: [MatToolbarModule, MatButtonModule, MatIconModule, MatMenuModule, RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header {
  private router = inject(Router);
  //TODO: Agregar obtención de dirección mediante service
  ubicacionActual = signal('Direccion 46');
  items = signal(['hola', 'abc', 'direccion 244']);
  // TODO: Agregar control de logged in
  isLoggedIn = signal(false);
  routeLogin = signal(false); // true if route is equal to login or register
  mostrarCarrito = computed(() => this.isLoggedIn());
  mostrarLogin = computed(() => !this.isLoggedIn() && !this.routeLogin());

  constructor() {
    this.router.events.pipe(
      takeUntilDestroyed()
    ).subscribe(
      event => {
      if (event instanceof NavigationEnd) {
        this.routeLogin.set(event.urlAfterRedirects === '/login' || event.urlAfterRedirects === '/register');
      }
    });
  }


  onCambiarSeleccion(item: any) {
    this.ubicacionActual.set(item);
  }

}
