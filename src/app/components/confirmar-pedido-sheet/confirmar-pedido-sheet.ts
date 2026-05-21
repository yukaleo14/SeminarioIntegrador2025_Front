import { Component, inject } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';

import { ConfirmarPedidoForm } from '../confirmar-pedido-form/confirmar-pedido-form';
import { Sucursal } from '../../models/Sucursal';

@Component({
  selector: 'app-confirmar-pedido-sheet',
  standalone: true,
  imports: [ConfirmarPedidoForm],
  template: `
    <app-confirmar-pedido-form
      [sucursal]="sucursal"
      (cerrar)="sheetRef.dismiss()"
      (confirmado)="sheetRef.dismiss($event)"
    />
  `,
  styles: [':host{display:block;height:90dvh;max-height:90dvh}'],
})
export class ConfirmarPedidoSheet {
  sheetRef = inject(MatBottomSheetRef<ConfirmarPedidoSheet>);
  sucursal = inject<{ sucursal: Sucursal }>(MAT_BOTTOM_SHEET_DATA).sucursal;
}
