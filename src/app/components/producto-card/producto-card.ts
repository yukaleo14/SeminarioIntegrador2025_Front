import { Component, inject, input } from '@angular/core';
import { Producto } from '../../models/Producto';
import { NgOptimizedImage } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { Router } from '@angular/router';

@Component({
  selector: 'app-producto-card',
  standalone: true,
  imports: [MatCardModule, NgOptimizedImage, MatChipsModule],
  templateUrl: './producto-card.html',
  styleUrls: ['./producto-card.scss'],
})
export class ProductoCard {
  producto = input.required<Producto>();

  private readonly router = inject(Router);

  irASucursal() {
    const id = this.producto().sucursal?.id;
    if (id) this.router.navigate(['/sucursal', id]);
  }
}
