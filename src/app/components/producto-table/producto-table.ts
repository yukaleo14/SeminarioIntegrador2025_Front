import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ProductoDialogComponent } from '../producto-dialog/producto-dialog';
import { MatIconModule } from "@angular/material/icon";
import { CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { ProductoService } from '../../services/producto-service';
import { AuthService } from '../../services/auth-service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Producto } from '../../models/Producto';
import { Header } from '../header/header';

@Component({
  selector: 'app-producto-table',
  templateUrl: './producto-table.html',
  styleUrls: ['./producto-table.scss'],
  imports: [Header, MatIconModule, MatPaginatorModule, CurrencyPipe, MatTableModule, MatButtonModule, MatCardModule]
})
export class ProductoTableComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['nombre', 'categoria', 'precio', 'acciones'];
  dataSource = new MatTableDataSource<Producto>([]);
  isLoading = true;
  error: string | null = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    public dialog: MatDialog,
    private productoService: ProductoService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadProductos();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  loadProductos() {
    this.isLoading = true;
    const empresaId = this.authService.getEmpresaId();
    const source$ = empresaId
      ? this.productoService.getProductosByEmpresa(empresaId)
      : this.productoService.getProductos();

    source$.subscribe({
      next: (productos) => {
        this.dataSource.data = productos;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar productos: ' + err.message;
        this.isLoading = false;
        this.snackBar.open(this.error, 'OK', { duration: 3000 });
      }
    });
  }

  goToHome() {
    this.router.navigate(['/home']);
  }

  openDialog(producto?: Producto): void {
    const dialogRef = this.dialog.open(ProductoDialogComponent, {
      width: '500px',
      data: { producto: producto ? { ...producto } : null, isCreate: !producto }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (result.isCreate) {
          this.createProducto(result.producto);
        } else {
          this.updateProducto(result.producto);
        }
      }
    });
  }

  createProducto(producto: Producto) {
    if (!this.checkAuth()) return;
    this.productoService.createProducto(producto).subscribe({
      next: () => {
        // El backend devuelve 201 sin cuerpo, así que recargamos la lista completa
        // para que la tabla muestre el nuevo producto sin necesidad de recargar la página
        this.loadProductos();
        this.snackBar.open('Producto creado exitosamente', 'OK', { duration: 3000 });
      },
      error: (err) => this.snackBar.open('Error al crear: ' + err.message, 'OK', { duration: 3000 })
    });
  }

  updateProducto(producto: Partial<Producto>) {
    if (!this.checkAuth() || !producto.id) return;
    this.productoService.updateProducto(producto.id, producto).subscribe({
      next: () => {
        // Mismo criterio: recargamos la lista para reflejar los cambios
        this.loadProductos();
        this.snackBar.open('Producto actualizado', 'OK', { duration: 3000 });
      },
      error: (err) => this.snackBar.open('Error al actualizar: ' + err.message, 'OK', { duration: 3000 })
    });
  }

  deleteProducto(id: number) {
    if (!this.checkAuth()) return;
    const confirmed = confirm('¿Seguro que querés eliminar este producto?');
    if (confirmed) {
      this.productoService.deleteProducto(id).subscribe({
        next: () => {
          this.dataSource.data = this.dataSource.data.filter(p => p.id !== id);
          this.snackBar.open('Producto eliminado', 'OK', { duration: 3000 });
        },
        error: (err) => this.snackBar.open('Error al eliminar: ' + err.message, 'OK', { duration: 3000 })
      });
    }
  }

  private checkAuth(): boolean {
    if (!this.authService.isAuthenticated()) {
      this.snackBar.open('Debes iniciar sesión para esta acción', 'OK', { duration: 3000 });
      this.router.navigate(['/login']);
      return false;
    }
    return true;
  }
}