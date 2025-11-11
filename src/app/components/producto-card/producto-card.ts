import { Component, input, output, signal } from '@angular/core';
import { Producto } from '../../models/Producto';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-producto-card',
  standalone: true,
  imports: [MatCardModule, NgOptimizedImage, MatButtonModule, MatIconModule, FormsModule],
  templateUrl: './producto-card.html',
  styleUrls: ['./producto-card.scss'],
})
export class ProductoCard {
  producto = input.required<Producto>();
  agregar = output<{ producto: Producto; cantidad: number }>();

  expandido = signal(false);
  cantidad = 1;

  expandir() {
    this.expandido.set(true);
  }

  cancelar() {
    this.expandido.set(false);
    this.cantidad = 1;
  }

  confirmar() {
    if (this.cantidad > 0) {
      this.agregar.emit({ producto: this.producto(), cantidad: this.cantidad });
      this.expandido.set(false);
      this.cantidad = 1;
    }
  }
}
