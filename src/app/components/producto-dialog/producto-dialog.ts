import { CommonModule, CurrencyPipe, NgOptimizedImage } from '@angular/common';
import { Component, inject, Inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogContent, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatOption, MatSelectModule } from '@angular/material/select';
import { MatAnchor } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { Producto } from '../../models/Producto';
import { CategoriaService } from '../../services/categoria-service';
import { SucursalService } from '../../services/sucursal-service';
import { AuthService } from '../../services/auth-service';

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
export class ProductoDialogComponent {
  private fb = inject(FormBuilder);
  private categoriaService = inject(CategoriaService);
  private sucursalService = inject(SucursalService);
  private authService = inject(AuthService);

  isEditMode = signal(false);
  imagePreview = signal<string | null>(null);

  categorias = toSignal(this.categoriaService.getLista(), { initialValue: [] });
  sucursales = toSignal(
    this.authService.getEmpresaId()
      ? this.sucursalService.findByEmpresa(this.authService.getEmpresaId()!)
      : this.sucursalService.findAll(),
    { initialValue: [] }
  );

  productoForm = this.fb.group({
    id: [null as number | null],
    nombre: ['', Validators.required],
    descripcion: [''],
    categoriaId: [null as number | null, Validators.required],
    sucursalId: [null as number | null, Validators.required],
    precio: [null as number | null, [Validators.required, Validators.min(0.01)]],
    tiempoPreparacionEstimado: [null as number | null, [Validators.required, Validators.min(1)]],
    imagen: [null as string | null]
  });

  constructor(
    public dialogRef: MatDialogRef<ProductoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { producto: Producto | null; isCreate: boolean }
  ) {
    this.isEditMode.set(data.isCreate);

    if (data.producto) {
      this.productoForm.patchValue({
        id: data.producto.id ?? null,
        nombre: data.producto.nombre,
        descripcion: data.producto.descripcion ?? '',
        categoriaId: data.producto.categoriaId ?? data.producto.categoria?.id ?? null,
        sucursalId: data.producto.sucursalId ?? data.producto.sucursal?.id ?? null,
        precio: data.producto.precio,
        tiempoPreparacionEstimado: data.producto.tiempoPreparacionEstimado,
      });
      this.imagePreview.set(data.producto.imagen ?? null);
    }
  }

  onEdit(): void {
    this.isEditMode.set(true);
  }

  onFileChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        this.imagePreview.set(result);
        this.productoForm.patchValue({ imagen: result });
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit(): void {
    if (this.productoForm.valid) {
      this.dialogRef.close({
        producto: {
          ...this.productoForm.value,
          imagen: this.productoForm.value.imagen ?? '',
          estadoId: 1
        },
        isCreate: this.data.isCreate
      });
    }
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
