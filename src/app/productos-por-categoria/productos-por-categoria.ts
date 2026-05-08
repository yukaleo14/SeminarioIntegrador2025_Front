import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CategoriaService } from '../services/categoria-service';
import { ProductoService } from '../services/producto-service';
import { ActivatedRoute, Router } from '@angular/router';
import { Producto } from '../models/Producto';
import { Categoria } from '../models/Categoria';
import { CarroService } from '../services/carro-service';
import { AuthService } from '../services/auth-service';
import { Header } from "../components/header/header";
import { ProductoCard } from '../components/producto-card/producto-card';

@Component({
  selector: 'app-productos-por-categoria',
  standalone: true,
  imports: [Header, ProductoCard],
  templateUrl: './productos-por-categoria.html',
  styleUrl: './productos-por-categoria.scss'
})
export class ProductosPorCategoria implements OnInit {

  private carroService = inject(CarroService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productoService = inject(ProductoService);
  private categoriaService = inject(CategoriaService);
  private authService = inject(AuthService);

  productos = signal<Producto[]>([]);
  categoriaActual = signal<Categoria | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  hasProductos = computed(() => this.productos().length > 0);

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('idCategoria');
    const categoriaId = idParam ? parseInt(idParam) : NaN;

    if (!categoriaId || isNaN(categoriaId) || categoriaId <= 0) {
      this.router.navigate(['/']);
      return;
    }

    this.cargarDatos(categoriaId);
  }

  private cargarDatos(categoriaId: number): void {
    this.categoriaService.getById(categoriaId).subscribe({
      next: (categoria) => this.categoriaActual.set(categoria),
      error: () => {
        this.error.set('No se pudo cargar la categoría');
        this.loading.set(false);
      }
    });

    this.productoService.getByCategoria(categoriaId).subscribe({
      next: (data) => {
        this.productos.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los productos');
        this.loading.set(false);
      }
    });
  }

  volver() {
    window.history.back();
  }

  agregarAlCarrito(event: { producto: Producto; cantidad: number }) {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    this.carroService.addProduct(event.producto, event.cantidad);
  }
}
