import { Component, input, output, signal } from '@angular/core';
import { Producto } from '../../models/Producto';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NgOptimizedImage } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-producto-card-compra',
  standalone: true,
  imports: [MatCardModule, NgOptimizedImage, MatButtonModule, MatIconModule],
  templateUrl: './producto-card-compra.html',
  styleUrls: ['./producto-card-compra.scss'],
})
export class ProductoCardCompra {
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

  decrementar() {
    if (this.cantidad > 1) this.cantidad--;
  }

  incrementar() {
    this.cantidad++;
  }
  
  getImagenUrl(nombreArchivo: string): string {
    return "http://localhost:3000/file/productos/" + nombreArchivo;
  }

  confirmar() {
    if (this.cantidad > 0) {
      this.agregar.emit({ producto: this.producto(), cantidad: this.cantidad });
      this.expandido.set(false);
      this.cantidad = 1;
    }
  }
}
