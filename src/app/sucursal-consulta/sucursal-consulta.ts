import { CommonModule, NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { CarruselCategorias } from '../components/carrusel-categorias/carrusel-categorias';
import { ProductoCard } from '../components/producto-card/producto-card';
import { Categoria } from '../models/Categoria';
import { Producto } from '../models/Producto';
import { Sucursal } from '../models/Sucursal';
import { CarroService } from '../services/carro-service';
import { ProductoService } from '../services/producto-service';
import { SucursalService } from '../services/sucursal-service';
import { CategoriaService } from '../services/categoria-service';
import { HttpErrorResponse } from '@angular/common/http';


@Component({
  selector: 'app-sucursal-consulta',
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatCardModule,
    MatDividerModule,
    NgOptimizedImage,
    ProductoCard,
    CarruselCategorias,
  ],
  templateUrl: './sucursal-consulta.html',
  styleUrls: ['./sucursal-consulta.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SucursalConsultaComponent {
  private readonly _empresaService = inject(SucursalService);
  private readonly _productoService = inject(ProductoService);
  private readonly _categoriaService = inject(CategoriaService);
  private readonly _carro = inject(CarroService);
  private readonly destroyRef = inject(DestroyRef);
  idEmpresa = input.required<number>();
  productos = signal<Producto[]>([]);
  sucursal = signal<Sucursal | null>(null);
  isLoading = computed<boolean>(() => this.sucursal() === null && this.productos().length === 0);
  categorias = signal<Categoria[]>([]);
  categoriaSeleccionada = signal<Categoria>({ id: 0, nombre: 'Todos', imagen: '' });

  ngOnInit() {
    this._empresaService.getById(this.idEmpresa()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: data => this.sucursal.set(data),
      error: console.error
    });

    this._categoriaService.getListaBySucursal(this.idEmpresa())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: Categoria[]) => {
          this.categorias.set([{ id: 0, nombre: 'Todos', imagen: '(ruta a public/categoria-todas' } as Categoria, ...data]);
        },
        error: (err: HttpErrorResponse) => console.error(err)
      });

    this._productoService.getProductosBySucursalAndCategoria(this.idEmpresa())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => this.productos.set(data),
        error: (err) => console.error(err)
      });
  }

  onCategoriaSelect(categoria: Categoria) {
    this.categoriaSeleccionada.set(this.categorias().find(c => c.id === categoria.id)!);
    this._productoService.getProductosBySucursalAndCategoria(this.idEmpresa(), this.categoriaSeleccionada().id === 0 ? undefined : this.categoriaSeleccionada().id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => this.productos.set(data),
        error: (err) => console.error(err)
      });

  }

  agregarAlCarrito(obj: {producto: Producto, cantidad: number}) {
    this._carro.addProduct(obj.producto, obj.cantidad);
  }
}
