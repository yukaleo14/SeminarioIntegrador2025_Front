import { CommonModule, NgOptimizedImage } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CarruselCategorias } from '../components/carrusel-categorias/carrusel-categorias';
import { ConfirmarPedidoLauncher } from '../services/confirmar-pedido-launcher';
import { ProductoCardCompra } from '../components/producto-card-compra/producto-card-compra';
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
    MatDialogModule,
    NgOptimizedImage,
    ProductoCardCompra,
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
  private readonly _pedidoLauncher = inject(ConfirmarPedidoLauncher);
  private readonly _dialog = inject(MatDialog);
  private readonly _snackBar = inject(MatSnackBar);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  private readonly destroyRef = inject(DestroyRef);
  idEmpresa = input.required<number>();
  productos = signal<Producto[]>([]);
  sucursal = signal<Sucursal | null>(null);
  isLoading = computed<boolean>(() => this.sucursal() === null && this.productos().length === 0);
  categorias = signal<Categoria[]>([]);
  categoriaSeleccionada = signal<Categoria>({ id: 0, nombre: 'Todos', imagen: '' });

  totalItemsCarrito = computed(() => this._carro.getTotalItems());

  getImagenUrl(nombreArchivo: string): string {
    return "http://localhost:3000/file/sucursal/" + nombreArchivo;
  }

  ngOnInit() {
    this._empresaService.getById(this.idEmpresa()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: data => this.sucursal.set(data),
      error: console.error
    });

    const idEmpresa = this.idEmpresa();
    if (idEmpresa === undefined) {
      console.error('ID de empresa no disponible');
      return;
    }

    this._productoService.getProductosBySucursalAndCategoria(idEmpresa, 0)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => this.productos.set(data),
        error: (err) => console.error(err)
      });
  }

  onCategoriaSelect(categoria: Categoria) {
    this.categoriaSeleccionada.set(categoria);
    const idEmpresa = this.idEmpresa();
    if (idEmpresa === undefined) return;
    const categoriaId = categoria.id === 0 ? 0 : categoria.id;
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
    const sucursalActualId = this._carro.getCurrentSucursalId();
    const productoSucursalId = obj.producto.sucursalId;

    if (sucursalActualId && sucursalActualId !== productoSucursalId) {
      const ref = this._dialog.open(ConfirmSucursalDialog);
      ref.afterClosed().subscribe((confirma: boolean) => {
        if (confirma) {
          this._carro.clear();
          this._carro.addProduct(obj.producto, obj.cantidad);
          this._snackBar.open('Carrito actualizado', undefined, { duration: 2000 });
        }
      });
    } else {
      if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
      this._carro.addProduct(obj.producto, obj.cantidad);
      this._snackBar.open(`${obj.producto.nombre} agregado`, undefined, { duration: 1500 });
    }
  }

  abrirCarrito() {
    const sucursal = this.sucursal();
    if (!sucursal || this._carro.getTotalItems() === 0) return;
    this._pedidoLauncher.abrir(sucursal);
  }
}

// ── Diálogo inline de confirmación de cambio de sucursal ──────────────────────
import { Component as Comp } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { AuthService } from '../services/auth-service';
import { Router } from '@angular/router';

@Comp({
  selector: 'app-confirm-sucursal-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>¿Cambiar sucursal?</h2>
    <mat-dialog-content>
      Tu carrito tiene productos de otra sucursal. Si continuás, se vaciará el carrito actual.
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button [mat-dialog-close]="false">Cancelar</button>
      <button mat-flat-button color="warn" [mat-dialog-close]="true">Vaciar y continuar</button>
    </mat-dialog-actions>
  `,
})
export class ConfirmSucursalDialog {
  constructor(public dialogRef: MatDialogRef<ConfirmSucursalDialog>) {}
}
