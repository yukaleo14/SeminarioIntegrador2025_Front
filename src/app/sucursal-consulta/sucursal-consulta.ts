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
import { CategoriaService } from '../services/categoria-service';
import { FileService } from '../services/file-service';
import { ProductoService } from '../services/producto-service';
import { SucursalService } from '../services/sucursal-service';


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
  private readonly _fileService = inject(FileService);

  private readonly destroyRef = inject(DestroyRef);
  idEmpresa = input.required<number>();
  productos = signal<Producto[]>([]);
  sucursal = signal<Sucursal | null>(null);
  isLoading = computed<boolean>(() => this.sucursal() === null && this.productos().length === 0);
  categorias = signal<Categoria[]>([]);
  categoriaSeleccionada = signal<Categoria>({ id: 0, nombre: 'Todos', imagen: '' });
  getImagenUrl(): string {
    const nombreArchivo: string = this.sucursal()?.imagen ? 'sucursal/' + this.sucursal()!.id + '/' + this.sucursal()!.imagen : 'logo-placeholder.png'
    return this._fileService.getImagenUrl(nombreArchivo);
  }

  ngOnInit() {
    this._empresaService.getById(this.idEmpresa()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: data => this.sucursal.set(data),
      error: console.error
    });

    // Chequeo para idEmpresa undefined
    const idEmpresa = this.idEmpresa();
    if (idEmpresa === undefined) {
      console.error('ID de empresa no disponible');
      return;
    }

    // Get all products for the sucursal (no category filter on init)
    this._productoService.getProductosBySucursalAndCategoria(idEmpresa, 0)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => this.productos.set(data),
        error: (err) => console.error(err)
      });
  }

  onCategoriaSelect(categoria: Categoria) {
    this.categoriaSeleccionada.set(categoria);
    const filtro = categoria.id === 0 ? undefined : categoria.id;

    // Chequeo para idEmpresa undefined
    const idEmpresa = this.idEmpresa();
    if (idEmpresa === undefined) {
      console.error('ID de empresa no disponible');
      return;
    }

    // Ajusta si filtro es undefined: Usa un default o maneja
    const categoriaId = filtro ?? 0; // Ejemplo: Default a 0 si undefined
    this._productoService
      .getProductosBySucursalAndCategoria(idEmpresa, categoriaId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => this.productos.set(data),
        error: console.error
      });
  }
  volverAtras() {
    window.history.back();
  }


  agregarAlCarrito(obj: { producto: Producto, cantidad: number }) {
    this._carro.addProduct(obj.producto, obj.cantidad);
  }
}