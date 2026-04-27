import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, OnInit, output, signal } from '@angular/core';
import { Categoria } from '../../models/Categoria';
import { CategoriaService } from '../../services/categoria-service';
import { ItemCategoria } from '../item-categoria/item-categoria';
import { Router } from '@angular/router';

@Component({
  selector: 'app-carrusel-categorias',
  imports: [ItemCategoria],
  templateUrl: './carrusel-categorias.html',
  styleUrl: './carrusel-categorias.scss'
})
export class CarruselCategorias implements OnInit {
  filtroSucursal = input<number>();
  private readonly _dataService = inject(CategoriaService);
  private router = inject(Router);

  // State signals
  categorias = signal<Categoria[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Computed signals for derived state
  hasData = computed(() => this.categorias().length > 0);
  isEmpty = computed(() => !this.loading() && this.categorias().length === 0);

  ngOnInit(): void {
    if(this.filtroSucursal()){
      // Load categorias filtrando
      this._dataService.getListaBySucursal(this.filtroSucursal()!).pipe().subscribe({
        next: (data: Categoria[]) => {
          this.categorias.set(data);
        }});
        return;
    }
    this.loadCategorias();
  }

  categoriaSeleccionada = output<Categoria>();

  onCategoriaClick(categoria: Categoria) {
    this.categoriaSeleccionada.emit(categoria);
    this.router.navigate(['/categoria', categoria.id, 'productos']);
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
