import { Component, input, output } from '@angular/core';
import { Producto } from '../../models/Producto';
import { NgOptimizedImage } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-producto-card',
  imports: [NgOptimizedImage, MatIconModule, MatButtonModule, MatCardModule],
  templateUrl: './producto-card.html',
  styleUrl: './producto-card.scss'
})
export class ProductoCard {
  producto = input.required<Producto>()

  // Pedir cantidad cuando seleccione el producto
  agregar = output<Producto>();
  onAgregar(): void {
    this.agregar.emit(this.producto());
  }
}
