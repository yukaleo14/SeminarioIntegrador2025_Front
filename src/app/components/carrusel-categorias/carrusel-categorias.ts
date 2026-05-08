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

  categorias = signal<Categoria[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  categoriaActivaId = signal<number>(0);

  hasData = computed(() => this.categorias().length > 0);
  isEmpty = computed(() => !this.loading() && this.categorias().length === 0);

  ngOnInit(): void {
    if (this.filtroSucursal()) {
      this._dataService.getListaBySucursal(this.filtroSucursal()!).subscribe({
        next: (data: Categoria[]) => this.categorias.set(data),
        error: (err: HttpErrorResponse) => this.error.set(this.getErrorMessage(err))
      });
      return;
    }
    this.loadCategorias();
  }

  categoriaSeleccionada = output<Categoria>();

  onTodosClick() {
    this.categoriaActivaId.set(0);
    this.categoriaSeleccionada.emit({ id: 0, nombre: 'Todos', imagen: '' });
  }

  onCategoriaClick(categoria: Categoria) {
    if (this.filtroSucursal()) {
      this.categoriaActivaId.set(categoria.id);
      this.categoriaSeleccionada.emit(categoria);
    } else {
      this.router.navigate(['/categoria', categoria.id, 'productos']);
    }
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
