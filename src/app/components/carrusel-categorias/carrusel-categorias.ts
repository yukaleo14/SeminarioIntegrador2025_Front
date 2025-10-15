import { Component, inject, OnInit, signal, computed, resource } from '@angular/core';
import { CategoriaItem } from '../../models/Categoria';
import { Categoria } from '../../services/categoria';
import { ItemCategoria } from '../item-categoria/item-categoria';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-carrusel-categorias',
  imports: [ItemCategoria],
  templateUrl: './carrusel-categorias.html',
  styleUrl: './carrusel-categorias.scss'
})
export class CarruselCategorias implements OnInit {
  private readonly _dataService = inject(Categoria);

  // State signals
  categorias = signal<CategoriaItem[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Computed signals for derived state
  hasData = computed(() => this.categorias().length > 0);
  isEmpty = computed(() => !this.loading() && this.categorias().length === 0);

  ngOnInit(): void {
    this.loadCategorias();
  }

  loadCategorias(): void {
    this.loading.set(true);
    this.error.set(null);

    this._dataService.getLista().subscribe({
      next: (data) => {
        this.categorias.set(data);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error loading categorias:', err);
        this.error.set(this.getErrorMessage(err));
        this.loading.set(false);
      }
    });
  }

  private getErrorMessage(error: HttpErrorResponse): string {
    if (error.error?.message) {
      return error.error.message;
    }
    return error.message;
  }
}
