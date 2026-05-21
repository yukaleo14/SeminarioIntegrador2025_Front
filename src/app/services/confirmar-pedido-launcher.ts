import { Injectable, inject } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatDialog } from '@angular/material/dialog';

import { ConfirmarPedidoSheet } from '../components/confirmar-pedido-sheet/confirmar-pedido-sheet';
import { ConfirmarPedidoDialog } from '../components/confirmar-pedido-dialog/confirmar-pedido-dialog';
import { Sucursal } from '../models/Sucursal';

/**
 * Abre el formulario de confirmación de pedido en la superficie adecuada:
 * bottom sheet en mobile, diálogo centrado en desktop.
 */
@Injectable({ providedIn: 'root' })
export class ConfirmarPedidoLauncher {
  private breakpoints = inject(BreakpointObserver);
  private bottomSheet = inject(MatBottomSheet);
  private dialog = inject(MatDialog);

  abrir(sucursal: Sucursal) {
    const esHandset = this.breakpoints.isMatched(Breakpoints.Handset);

    if (esHandset) {
      this.bottomSheet.open(ConfirmarPedidoSheet, {
        data: { sucursal },
        panelClass: 'pedido-sheet-panel',
      });
    } else {
      this.dialog.open(ConfirmarPedidoDialog, {
        data: { sucursal },
        panelClass: 'pedido-dialog-panel',
        width: 'min(920px, 94vw)',
        maxWidth: '94vw',
        height: 'min(680px, 90vh)',
        autoFocus: false,
      });
    }
  }
}
