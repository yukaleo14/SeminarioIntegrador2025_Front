import { CommonModule, CurrencyPipe, NgOptimizedImage } from '@angular/common';
import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogContent, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormField, MatLabel } from "@angular/material/form-field";
import { MatOption, MatSelectModule } from "@angular/material/select";
import { MatAnchor } from "@angular/material/button";
import { MatInputModule } from '@angular/material/input';
import { Producto } from '../../models/Producto';
import { Categoria } from '../../models/Categoria';
import { Sucursal } from '../../models/Sucursal';
import { CategoriaService } from '../../services/categoria-service';
import { SucursalService } from '../../services/sucursal-service';

@Component({
  selector: 'app-producto-dialog',
  templateUrl: './producto-dialog.html',
  styleUrls: ['./producto-dialog.scss'],
  imports: [
    ReactiveFormsModule, MatLabel, NgOptimizedImage, MatFormField,
    MatSelectModule, MatOption, MatDialogContent, CurrencyPipe,
    MatDialogModule, CommonModule, MatAnchor, MatInputModule
  ]
})
export class ProductoDialogComponent implements OnInit {
  isEditMode = false;
  productoForm!: FormGroup;
  imagePreview: string | null = null;

  // Estos arrays se llenan desde el backend, ya no son mocks
  categorias: Categoria[] = [];
  sucursales: Sucursal[] = [];

  constructor(
    public dialogRef: MatDialogRef<ProductoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { producto: Producto | null, isCreate: boolean },
    private fb: FormBuilder,
    private categoriaService: CategoriaService,
    private sucursalService: SucursalService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isEditMode = this.data.isCreate || false;

    // Cargamos las listas desde el backend al abrir el dialog
    this.categoriaService.getLista().subscribe({
      next: (data) => { this.categorias = data; this.cdr.detectChanges(); },
      error: (err) => console.error('Error al cargar categorías:', err)
    });

    this.sucursalService.findAll().subscribe({
      next: (data) => { this.sucursales = data; this.cdr.detectChanges(); },
      error: (err) => console.error('Error al cargar sucursales:', err)
    });

    // Los campos coinciden exactamente con el CreateProductoDto del backend.
    // estadoId fue eliminado: el backend lo asigna automáticamente.
    this.productoForm = this.fb.group({
      id: [null],   // necesario para que updateProducto() pueda identificar cuál editar
      nombre: ['', Validators.required],
      descripcion: [''],
      categoriaId: [null, Validators.required],
      sucursalId: [null, Validators.required],
      precio: [null, [Validators.required, Validators.min(0.01)]],
      tiempoPreparacionEstimado: [null, [Validators.required, Validators.min(1)]],
      imagen: [null]
    });

    // Si estamos editando, precargamos los valores del producto
    if (this.data.producto) {
      this.productoForm.patchValue({
        id: this.data.producto.id,   // ← cargamos el id para no perderlo al cerrar
        nombre: this.data.producto.nombre,
        descripcion: this.data.producto.descripcion,
        categoriaId: this.data.producto.categoriaId ?? this.data.producto.categoria?.id ?? null,
        sucursalId: this.data.producto.sucursalId ?? this.data.producto.sucursal?.id ?? null,
        precio: this.data.producto.precio,
        tiempoPreparacionEstimado: this.data.producto.tiempoPreparacionEstimado,
      });
      this.imagePreview = this.data.producto.imagen ?? null;
    }
  }

  onEdit(): void {
    this.isEditMode = true;
  }

  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview = e.target?.result as string;
        this.productoForm.patchValue({ imagen: this.imagePreview });
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit(): void {
    if (this.productoForm.valid) {
      const producto = {
        ...this.productoForm.value,
        // El backend rechaza null: si no se cargó imagen enviamos string vacío
        imagen: this.productoForm.value.imagen ?? '',
        // El backend requiere estadoId aunque tenga estado por defecto en su lógica.
        // Enviamos 1 (Activo) hasta que el equipo de backend lo haga verdaderamente opcional.
        estadoId: 1
      };

      this.dialogRef.close({
        producto,
        isCreate: this.data.isCreate
      });
    }
  }

  onClose(): void {
    this.dialogRef.close();
  }
}