import { CommonModule, NgOptimizedImage } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  signal
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { ProductoCard } from '../components/producto-card/producto-card';
import { Producto } from '../models/Producto';
import { Sucursal } from '../models/Sucursal';
import { CarroService } from '../services/carro-service';
import { EmpresaService } from '../services/empresa-service';
import { Categoria } from '../models/Categoria';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';


@Component({
  selector: 'app-empresa-consulta',
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatCardModule,
    MatDividerModule,
    NgOptimizedImage,
    ProductoCard,
  ],
  templateUrl: './empresa-consulta.html',
  styleUrls: ['./empresa-consulta.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmpresaConsultaComponent {
  private readonly _empresaService = inject(EmpresaService);
  private readonly _carro = inject(CarroService);
  private readonly destroyRef = inject(DestroyRef);
  idEmpresa = input.required<number>();
  productos = signal<Producto[]>([]);
  empresa = signal<Sucursal | null>(null);
  isLoading = computed<boolean>(() => this.empresa() === null && this.productos().length === 0);
  categorias = computed<Categoria[]>(() => {
    const set = new Set(this.productos().map(p => p.categoria));
    return Array.from(set);
  });
  categoriaSeleccionada = signal<Categoria>({ id: 0, nombre: 'Todos', imagen: '' });

  productosFiltrados = computed(() => this.productos().filter(
    p => p.categoria === this.categoriaSeleccionada()
  ));


ngOnInit() {
  this._empresaService.getById(this.idEmpresa()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
    next: data => this.empresa.set(data),
    error: console.error
  });

  this._empresaService.getProductosBySucursal(this.idEmpresa())
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: data => this.productos.set(data),
      error:(err)=> console.error(err)
    });
}

  onCategoriaSelect(categoria: number) {
    this.categoriaSeleccionada.set(this.categorias().find(c => c.id === categoria)!);
  }

  agregarAlCarrito(producto: Producto) {
    this._carro.addProduct(producto, 1);
  }

}
