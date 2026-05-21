import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { ConfirmarPedidoForm } from '../confirmar-pedido-form/confirmar-pedido-form';
import { Sucursal } from '../../models/Sucursal';

@Component({
  selector: 'app-confirmar-pedido-dialog',
  standalone: true,
  imports: [ConfirmarPedidoForm],
  template: `
    <app-confirmar-pedido-form
      [sucursal]="data.sucursal"
      (cerrar)="dialogRef.close()"
      (confirmado)="dialogRef.close($event)"
    />
  `,
  styles: [':host{display:block;height:100%}'],
})
export class ConfirmarPedidoDialog {
  dialogRef = inject(MatDialogRef<ConfirmarPedidoDialog>);
  data = inject<{ sucursal: Sucursal }>(MAT_DIALOG_DATA);
}
