import { CommonModule, NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { Producto } from '../models/Producto';
import { EmpresaService } from '../services/empresa-service';
import { Empresa } from '../models/Empresa';
import { ProductoCard } from '../components/producto-card/producto-card';
import { CarroService } from '../services/carro-service';


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
  idEmpresa = input.required<number>();
  productos = signal<Producto[]>([]);
  empresa = signal<Empresa | null>(null);
  isLoading = computed( ()=> {this.empresa() === null});
  categorias = computed(() => {
    const set = new Set(this.productos().map(p => p.categoria.nombre));
    return Array.from(set);
  });
  categoriaSeleccionada = signal<string>('');

  productosFiltrados = computed(() =>
    this.productos().filter(
      p => p.categoria.nombre === this.categoriaSeleccionada()
    )
  );

  getEmpresa(){

  }

  ngOnInit() {
      // Simulación de carga
    this._empresaService.getById(this.idEmpresa()).subscribe(data => {
      this.empresa.set(data)
    });
    // Simulación de carga
    this._empresaService.getProductos().subscribe(data => {
      this.productos.set(data);
    });
  }

  onCategoriaSelect(categoria: string) {
    this.categoriaSeleccionada.set(categoria);
  }

  agregarAlCarrito(producto: Producto){

  }

}
