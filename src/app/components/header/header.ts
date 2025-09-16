import { Component, signal } from '@angular/core';
import { MatBadge } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-header',
  imports: [MatToolbarModule, MatButtonModule, MatIconModule, MatMenuModule, MatBadge],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header {
  ubicacionActual = signal('Direccion 46');
  cantPedidos = signal(5);
  items = signal(['hola', 'abc', 'direccion 244']);
  isLoggedIn = signal(false);

  onCambiarSeleccion(item: any){
    this.ubicacionActual.set(item);
  }

}
