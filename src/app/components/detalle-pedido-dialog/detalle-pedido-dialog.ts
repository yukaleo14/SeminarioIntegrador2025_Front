import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { Pedido } from './../../services/pedido-service'; // Ajusta la ruta si es necesario

@Component({
  selector: 'app-detalle-pedido-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatDividerModule],
  template: `
    <div class="dialog-header">
      <h2 mat-dialog-title class="dialog-title">Pedido {{ data.numero }}</h2>
      <span class="estado-badge" [ngClass]="getEstadoClass(data.estado?.nombre)">
        {{ data.estado?.nombre || 'SIN ESTADO' }}
      </span>
    </div>

    <mat-dialog-content class="dialog-content">
      
      <div class="info-section">
        <div class="info-row">
          <span class="label">Fecha de Creación:</span>
          <span class="value">{{ data.fechaHora | date:'dd/MM/yyyy HH:mm' }}</span>
        </div>
        <div class="info-row">
          <span class="label">Llegada Estimada:</span>
          <span class="value">{{ data.horaLlegadaEstimada | date:'dd/MM/yyyy HH:mm' }}</span>
        </div>
      </div>

      <mat-divider></mat-divider>

      <div class="info-section grid-2">
        <div class="info-box">
          <span class="label-sm">Prep. Estimada</span>
          <span class="value-box">{{ data.tiempoPreparacionEstimado }} min</span>
        </div>
        <div class="info-box">
          <span class="label-sm">Reparto Estimado</span>
          <span class="value-box">{{ data.tiempoRepartoEstimado }} min</span>
        </div>
      </div>

      <mat-divider></mat-divider>

      <div class="info-section">
        <div class="info-row">
          <span class="label">Cliente:</span>
          <span class="value">
            {{ data.comprador?.nombre || 'N/A' }} <span class="id-text">(ID: {{ data.compradorId }})</span>
          </span>
        </div>
        <div class="info-row">
          <span class="label">Repartidor:</span>
          <span class="value">
            {{ data.repartidor?.nombre || 'Sin asignar' }} 
            <span class="id-text" *ngIf="data.repartidorId">(ID: {{ data.repartidorId }})</span>
          </span>
        </div>
      </div>

      <mat-divider></mat-divider>

      <div class="info-section total-section">
        <span class="label-total">Monto Total:</span>
        <span class="value-total">\${{ data.montoTotal | number:'1.2-2' }}</span>
      </div>

    </mat-dialog-content>

    <mat-dialog-actions align="center" class="dialog-actions">
      <button mat-flat-button color="primary" mat-dialog-close>Cerrar Detalle</button>
    </mat-dialog-actions>
  `,
  styles: [`
    /* Encabezado centrado */
    .dialog-header {
      text-align: center;
      padding: 24px 24px 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
    }
    
    .dialog-title {
      margin: 0;
      color: #2c3e50;
      font-weight: 700;
      font-size: 1.4rem;
      line-height: 1.2;
    }

    .estado-badge {
      padding: 4px 14px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #fff;
    }

    /* Clases dinámicas de estado basadas en tu tabla anterior */
    .bg-danger      { background-color: #e74c3c; }
    .bg-success     { background-color: #27ae60; }
    .bg-warning     { background-color: #f39c12; color: #2c3e50; }
    .bg-info        { background-color: #3498db; }
    .bg-default     { background-color: #95a5a6; }

    /* Contenido de la ventana */
    .dialog-content {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 0 24px 20px !important;
      overflow-x: hidden;
    }

    .info-section {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 6px 0;
    }

    /* Filas con alineación a los extremos */
    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.95rem;
    }

    .label {
      color: #7f8c8d;
      font-weight: 500;
    }

    .value {
      color: #2c3e50;
      font-weight: 600;
      text-align: right;
    }

    .id-text {
      color: #95a5a6;
      font-size: 0.8rem;
      font-weight: normal;
    }

    /* Grilla simétrica para los tiempos */
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .info-box {
      background-color: #f8f9fa;
      padding: 12px;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      gap: 6px;
      border: 1px solid #edf2f7;
    }

    .label-sm {
      font-size: 0.8rem;
      color: #7f8c8d;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 600;
    }

    .value-box {
      font-size: 1.1rem;
      color: #2c3e50;
      font-weight: 700;
    }

    /* Sección del Total */
    .total-section {
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      background-color: #f8fbff;
      padding: 16px;
      border-radius: 8px;
      margin-top: 4px;
      border: 1px solid #e1effe;
    }

    .label-total {
      font-size: 1.1rem;
      font-weight: 600;
      color: #2c3e50;
    }

    .value-total {
      font-size: 1.4rem;
      font-weight: 700;
      color: #27ae60;
    }

    /* Botón centrado al pie */
    .dialog-actions {
      padding: 0 24px 24px;
      justify-content: center;
    }
  `]
})
export class DetallePedidoDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<DetallePedidoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  // Método para asignar colores dinámicos al "badge" del encabezado
  getEstadoClass(estadoNombre?: string): string {
    if (!estadoNombre) return 'bg-default';
    const estado = estadoNombre.toUpperCase().trim();
    
    switch (estado) {
      case 'ENTREGADO':      return 'bg-success';
      case 'CANCELADO':
      case 'DEMORADO':       return 'bg-danger';
      case 'ENPREPARACION':  
      case 'EN PREPARACION': return 'bg-warning';
      case 'CREADO':         
      case 'ASIGNADO':       return 'bg-info';
      default:               return 'bg-default';
    }
  }
}